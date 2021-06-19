import { Ability } from '@casl/ability';
import {
  Controller,
  Get,
  Post,
  HttpCode,
  Param,
  Body,
  ValidationPipe,
  UsePipes,
  Inject,
  UseGuards,
  Put,
  ParseArrayPipe,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { Action } from '../../casl/action.enum';
import { CheckPolicies } from '../../casl/check-policies.decorator';
import { PoliciesGuard } from '../../casl/policies.guard';
import { UserDto } from '../../users/api/user.dto';
import { UsersRepository } from '../../users/entities/users.repository';
import {
  AcceptedResponse,
  ACCEPTED_RESPONSE_STATUS,
} from '../../utils/accepted-response';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { User } from '../../users/entities';
import { Violation } from '../entities/violation.entity';
import { ViolationsRepository } from '../entities/violations.repository';

@Controller('violations')
export class ViolationAssigneesController {
  constructor(
    @Inject(ViolationsRepository)
    private readonly violationsRepo: ViolationsRepository,
    @Inject(UsersRepository) private readonly usersRepo: UsersRepository,
  ) {}

  @Get(':violation/assignees')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Violation))
  async getAssignees(
    @Param('violation') violationId: string,
  ): Promise<UserDto[]> {
    const violation = await this.violationsRepo.findOneOrFail(violationId);

    return violation.assignees.map((user: User) => UserDto.fromEntity(user));
  }

  @Put(':violation/assignees')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Violation))
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['assignee'] },
      groups: ['assignee'],
    }),
  )
  async putAssignees(
    @Param('violation') violationId: string,
    @Body(
      new ParseArrayPipe({
        items: UserDto,
        transformOptions: { groups: ['assignee'] },
        groups: ['assignee'],
      }),
    )
    assigneeDtos: UserDto[],
    @InjectUser() user: User,
  ): Promise<AcceptedResponse> {
    const violation = await this.violationsRepo.findOneOrFail(violationId);
    violation.assign(
      user,
      assigneeDtos.map((userDto: UserDto) => userDto.toEntity()),
    );
    await this.violationsRepo.save(violation);

    return { status: ACCEPTED_RESPONSE_STATUS };
  }

  @Post(':violation/assignees')
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Violation))
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['assignee'] },
      groups: ['assignee'],
    }),
  )
  async addAssignee(
    @Param('violation') violationId: string,
    @Body() assigneeDto: UserDto,
    @InjectUser() actor: User,
  ): Promise<AcceptedResponse> {
    const violation = await this.violationsRepo.findOneOrFail(violationId);
    violation.assign(actor, [...violation.assignees, assigneeDto.toEntity()]);
    await this.violationsRepo.save(violation);

    return { status: ACCEPTED_RESPONSE_STATUS };
  }

  @Delete(':violation/assignees/:assignee')
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Violation))
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['assignee'] },
      groups: ['assignee'],
    }),
  )
  async deleteAssignee(
    @Param('violation') violationId: string,
    @Param('assignee') assigneeId: string,
    @InjectUser() user: User,
  ): Promise<AcceptedResponse> {
    const violation = await this.violationsRepo.findOneOrFail(violationId);
    const assigneeToBeDeleted = await this.usersRepo.findOneOrFail(assigneeId);
    const assignees = violation.assignees;
    const foundIndex = assignees.findIndex(
      (user: User) => user.id === assigneeToBeDeleted.id,
    );
    if (foundIndex < 0) {
      throw new NotFoundException('ASSIGNEE_NOT_FOUND');
    }
    assignees.splice(foundIndex, 1);
    violation.assign(user, assignees);
    await this.violationsRepo.save(violation);

    return { status: ACCEPTED_RESPONSE_STATUS };
  }
}
