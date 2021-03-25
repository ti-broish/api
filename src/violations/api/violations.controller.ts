import { Ability } from '@casl/ability';
import { Controller, Get, Post, HttpCode, Param, Body, UsePipes, ValidationPipe, Inject, ForbiddenException, UseGuards, Query } from '@nestjs/common';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { UserDto } from 'src/users/api/user.dto';
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
    @Inject(PicturesUrlGenerator) private readonly urlGenerator: PicturesUrlGenerator,
  ) {}


  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Violation))
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(@Query() query: ViolationsFilters): Promise<Pagination<ViolationDto>> {
    const pagination = await paginate(this.repo.queryBuilderWithFilters(query), { page: query.page, limit: 20, route: '/violations' });

    return new Pagination<ViolationDto>(
      await Promise.all(pagination.items.map(async (violation: Violation) =>
        ViolationDto.fromEntity(violation, ['violation.process', UserDto.AUTHOR_READ])
      )),
      pagination.meta,
      pagination.links,
    );
  }

  @Post()
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['create'] }, groups: ['create'] }))
  async create(
    @Body() violationDto: ViolationDto,
    @InjectUser() user: User,
  ): Promise<ViolationDto> {
    const violation = violationDto.toEntity();
    violation.setReceivedStatus(user);
    const savedDto = ViolationDto.fromEntity(await this.repo.save(violation), ['violation.process', UserDto.AUTHOR_READ]);
    this.updatePicturesUrl(savedDto);

    return savedDto;
  }

  @Get(':id')
  @HttpCode(200)
  async get(
    @Param('id') id: string,
    @InjectUser() user: User,
  ): Promise<ViolationDto> {
    const violation = await this.repo.findOneOrFail(id);
    if (violation.getAuthor().id !== user.id) {
      throw new ForbiddenException();
    }
    const dto = ViolationDto.fromEntity(violation, ['violation.process', UserDto.AUTHOR_READ]);
    this.updatePicturesUrl(dto);

    return dto;
  }

  private updatePicturesUrl(violationDto: ViolationDto) {
    violationDto.pictures.forEach((picture: PictureDto) => picture.url = this.urlGenerator.getUrl(picture));

    return violationDto;
  }
}
