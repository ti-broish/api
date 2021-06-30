import { Ability } from '@casl/ability';
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
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { UserDto } from 'src/users/api/user.dto';
import { paginationRoute } from 'src/utils/pagination-route';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { PictureDto } from '../../pictures/api/picture.dto';
import { PicturesUrlGenerator } from '../../pictures/pictures-url-generator.service';
import { User } from '../../users/entities';
import { Violation } from '../entities/violation.entity';
import { ViolationsRepository } from '../entities/violations.repository';
import { ViolationDto } from './violation.dto';
import { ViolationsFilters } from './violations-filters.dto';

@Controller('violations')
export class ViolationsController {
  constructor(
    @Inject(ViolationsRepository) private readonly repo: ViolationsRepository,
    @Inject(PicturesUrlGenerator)
    private readonly urlGenerator: PicturesUrlGenerator,
  ) {}

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Manage, Violation))
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
    );

    const processViolation = async (violation: Violation) => {
      const dto = ViolationDto.fromEntity(violation, [
        'violation.process',
        UserDto.AUTHOR_READ,
      ]);
      this.updatePicturesUrl(dto);

      return dto;
    };

    const promises: Promise<ViolationDto>[] = pagination.items.map(
      processViolation,
    );
    const violationDtoItems = await Promise.all(promises);

    return new Pagination<ViolationDto>(
      violationDtoItems,
      pagination.meta,
      pagination.links,
    );
  }

  @Post()
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Create, Violation))
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['create'] },
      groups: ['create'],
    }),
  )
  async create(
    @Body() violationDto: ViolationDto,
    @InjectUser() user: User,
  ): Promise<ViolationDto> {
    const violation = violationDto.toEntity();
    violation.setReceivedStatus(user);
    const savedDto = ViolationDto.fromEntity(await this.repo.save(violation), [
      'violation.process',
      UserDto.AUTHOR_READ,
    ]);
    this.updatePicturesUrl(savedDto);

    return savedDto;
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Violation))
  async get(@Param('id') id: string): Promise<ViolationDto> {
    const violation = await this.repo.findOneOrFail(id);
    const dto = ViolationDto.fromEntity(violation, [
      'violation.process',
      UserDto.AUTHOR_READ,
    ]);
    this.updatePicturesUrl(dto);

    return dto;
  }

  @Post(':id/reject')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Violation))
  async reject(
    @Param('id') id: string,
    @InjectUser() user: User,
  ): Promise<ViolationDto> {
    const violation = await this.repo.findOneOrFail(id);
    violation.reject(user);

    const dto = ViolationDto.fromEntity(await this.repo.save(violation), [
      'violation.process',
      UserDto.AUTHOR_READ,
    ]);
    this.updatePicturesUrl(dto);

    return dto;
  }

  @Post(':id/process')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Violation))
  async process(
    @Param('id') id: string,
    @InjectUser() user: User,
  ): Promise<ViolationDto> {
    const violation = await this.repo.findOneOrFail(id);
    violation.process(user);

    const dto = ViolationDto.fromEntity(await this.repo.save(violation), [
      'violation.process',
      UserDto.AUTHOR_READ,
    ]);
    this.updatePicturesUrl(dto);

    return dto;
  }

  @Patch(':id')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Violation))
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
    const violation = await this.repo.findOneOrFail(id);
    if (violationDto.isPublished) {
      violation.publish(user);
    } else {
      violation.unpublish(user);
    }

    const dto = ViolationDto.fromEntity(await this.repo.save(violation), [
      'violation.process',
      UserDto.AUTHOR_READ,
    ]);
    this.updatePicturesUrl(dto);

    return dto;
  }

  private updatePicturesUrl(violationDto: ViolationDto) {
    violationDto.pictures.forEach(
      (picture: PictureDto) =>
        (picture.url = this.urlGenerator.getUrl(picture)),
    );

    return violationDto;
  }
}
