import { Recaptcha } from '@nestlab/google-recaptcha/decorators/recaptcha'
import {
  Controller,
  Get,
  Post,
  HttpCode,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  Inject,
  UseGuards,
  Query,
  Patch,
  Request,
  NotFoundException,
} from '@nestjs/common'
import { Request as ExpressRequest } from 'express'
import { paginate, Pagination } from 'nestjs-typeorm-paginate'
import { Public } from 'src/auth/decorators'
import { Action } from 'src/casl/action.enum'
import { AppAbility } from 'src/casl/casl-ability.factory'
import { CheckPolicies } from 'src/casl/check-policies.decorator'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { paginationRoute } from 'src/utils/pagination-route'
import { InjectUser } from '../../auth/decorators/inject-user.decorator'
import { PictureDto } from '../../pictures/api/picture.dto'
import { PicturesUrlGenerator } from '../../pictures/pictures-url-generator.service'
import { User } from '../../users/entities'
import { Violation } from '../entities/violation.entity'
import { ViolationsRepository } from '../entities/violations.repository'
import { ViolationDto } from './violation.dto'
import { ViolationsFilters } from './violations-filters.dto'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'

@Controller('violations')
export default class ViolationsController {
  constructor(
    @Inject(ViolationsRepository) private readonly repo: ViolationsRepository,
    @Inject(PicturesUrlGenerator)
    private readonly urlGenerator: PicturesUrlGenerator,
  ) {}

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard, ThrottlerGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Manage, Violation))
  @Throttle(2, 60)
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(
    @Query() query: ViolationsFilters,
    @Request() req: ExpressRequest,
  ): Promise<Pagination<ViolationDto>> {
    const pagination = await paginate(
      this.repo.queryBuilderWithFilters(query),
      {
        page: query.page,
        limit: 100,
        route: paginationRoute(req),
      },
    )

    return new Pagination<ViolationDto>(
      pagination.items.map<ViolationDto>((violation: Violation) =>
        this.processViolation(violation),
      ),
      pagination.meta,
      pagination.links,
    )
  }

  @Post()
  @Public()
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Violation))
  @Recaptcha()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['create'] },
      groups: ['create'],
    }),
  )
  async create(
    @Body() violationDto: ViolationDto,
    @InjectUser() user?: User,
  ): Promise<ViolationDto> {
    return this.processViolation(
      await this.repo.save(violationDto.toEntity().setReceivedStatus(user)),
      ['read', 'violation.process', 'author_read', 'created'],
    )
  }

  @Public()
  @Get('feed')
  @HttpCode(200)
  async feed(@Query('after') after?: string): Promise<ViolationDto[]> {
    return (await this.repo.findPublishedViolations(after)).map(
      (violation: Violation) =>
        ViolationDto.fromEntity(violation, [ViolationDto.FEED]),
    )
  }

  @Public()
  @Get('feed/:segment')
  @HttpCode(200)
  async feedFilter(@Param('segment') segment: string): Promise<ViolationDto[]> {
    if (!segment.match(/^\d{2}(\d{2}(\d{2}(\d{3})?)?)?$/)) {
      throw new NotFoundException()
    }
    return (await this.repo.findPublishedViolationsSegment(segment)).map(
      (violation: Violation) =>
        ViolationDto.fromEntity(violation, [ViolationDto.FEED]),
    )
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Violation))
  async get(@Param('id') id: string): Promise<ViolationDto> {
    return this.processViolation(await this.repo.findOneOrFail(id))
  }

  @Post(':id/reject')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Violation))
  async reject(
    @Param('id') id: string,
    @InjectUser() user: User,
  ): Promise<ViolationDto> {
    const violation = await this.repo.findOneOrFail(id)
    violation.reject(user)

    return this.processViolation(await this.repo.save(violation))
  }

  @Post(':id/process')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Violation))
  async process(
    @Param('id') id: string,
    @InjectUser() user: User,
  ): Promise<ViolationDto> {
    const violation = await this.repo.findOneOrFail(id)
    violation.process(user)

    return this.processViolation(await this.repo.save(violation))
  }

  @Patch(':id')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Violation))
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['isPublishedUpdate'] },
      groups: ['isPublishedUpdate'],
      skipMissingProperties: true,
    }),
  )
  async patch(
    @Param('id') id: string,
    @InjectUser() user: User,
    @Body() violationDto: ViolationDto,
  ): Promise<ViolationDto> {
    const violation = await this.repo.findOneOrFail(id)
    // Allow editing publishing text without changing the published status
    if (violationDto.isPublished !== violation.isPublished) {
      if (violationDto.isPublished) {
        violation.publish(user)
      } else {
        violation.unpublish(user)
      }
    }

    violation.publishedText = violationDto.publishedText
    return this.processViolation(await this.repo.save(violation), [
      'read',
      'violation.process',
      'author_read',
      'isPublishedUpdate',
    ])
  }

  private updatePicturesUrl(violationDto: ViolationDto) {
    violationDto.pictures?.forEach(
      (picture: PictureDto) =>
        (picture.url = this.urlGenerator.getUrl(picture)),
    )

    return violationDto
  }

  private processViolation(
    violation: Violation,
    groups: string[] = ['read', 'violation.process', 'author_read'],
  ): ViolationDto {
    const dto = ViolationDto.fromEntity(violation, groups)
    this.updatePicturesUrl(dto)

    return dto
  }
}
