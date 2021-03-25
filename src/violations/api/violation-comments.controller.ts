import { Ability } from '@casl/ability';
import { Controller, Get, Post, HttpCode, Param, Body, UsePipes, ValidationPipe, Inject, UseGuards, Query } from '@nestjs/common';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { PageDTO } from 'src/utils/page.dto';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { User } from '../../users/entities';
import { ViolationComment } from '../entities/violation-comment.entity';
import { ViolationCommentsRepository } from '../entities/violation-comments.repository';
import { Violation } from '../entities/violation.entity';
import { ViolationsRepository } from '../entities/violations.repository';
import { ViolationCommentDto } from './violation-comment.dto';

@Controller('violations/:violation/comments')
export class ViolationCommentsController {
  constructor(
    @Inject(ViolationsRepository) private readonly violationsRepo: ViolationsRepository,
    @Inject(ViolationCommentsRepository) private readonly violationCommentsRepo: ViolationCommentsRepository,
  ) {}

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Violation))
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(
    @Query() query: PageDTO,
    @Param('violation') violationId: string,
  ): Promise<Pagination<ViolationCommentDto>> {
    const violation = await this.violationsRepo.findOneOrFail(violationId);
    const pagination = await paginate(this.violationCommentsRepo.queryBuilderForViolation(violation), {
      page: query.page,
      limit: 20,
      route: `/violations/${violationId}/comments`,
    });

    return new Pagination<ViolationCommentDto>(
      await Promise.all(pagination.items.map(async (violationComment: ViolationComment) =>
        ViolationCommentDto.fromEntity(violationComment)
      )),
      pagination.meta,
      pagination.links,
    );
  }

  @Post()
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['create'] }, groups: ['create'] }))
  async create(
    @Body() violationCommentDto: ViolationCommentDto,
    @Param('violation') violationId: string,
    @InjectUser() user: User,
  ): Promise<ViolationCommentDto> {
    const violationComment = violationCommentDto.toEntity();
    const violation = await this.violationsRepo.findOneOrFail(violationId);
    violationComment.author = user;
    violationComment.violation = violation;
    const savedDto = ViolationCommentDto.fromEntity(await this.violationCommentsRepo.save(violationComment));

    return savedDto;
  }
}
