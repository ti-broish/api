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
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Action } from '../../casl/action.enum';
import { CheckPolicies } from '../../casl/check-policies.decorator';
import { PoliciesGuard } from '../../casl/policies.guard';
import { UserDto } from '../../users/api/user.dto';
import { UsersRepository } from '../..//users/entities/users.repository';
import {
  AcceptedResponse,
  ACCEPTED_RESPONSE_STATUS,
} from '../../utils/accepted-response';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { User } from '../../users/entities';
import { Protocol } from '../entities/protocol.entity';
import { ProtocolsRepository } from '../entities/protocols.repository';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { ApiTags } from '@nestjs/swagger';
import { WorkQueue } from './work-queue.service';

@Controller('protocols')
export class ProtocolAssigneesController {
  constructor(
    @Inject(ProtocolsRepository)
    private readonly protocolsRepo: ProtocolsRepository,
    @Inject(UsersRepository) private readonly usersRepo: UsersRepository,
    private caslAbilityFactory: CaslAbilityFactory,
    private readonly workQueue: WorkQueue,
  ) {}

  @Get(':protocol/assignees')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Manage, Protocol))
  async getAssignees(
    @Param('protocol') protocolId: string,
  ): Promise<UserDto[]> {
    const protocol = await this.protocolsRepo.findOneOrFail(protocolId);

    return protocol.assignees.map((user: User) => UserDto.fromEntity(user));
  }

  /**
   * @deprecated No need to manage multiple assignees at once
   */
  @Put(':protocol/assignees')
  @ApiTags('Deprecated')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['assignee'] },
      groups: ['assignee'],
    }),
  )
  async putAssignees(
    @Param('protocol') protocolId: string,
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
    if (assigneeDtos.length > 1) {
      throw new BadRequestException(
        'CANNOT_ASSIGN_MORE_THAN_ONE_PERSON_TO_PROTOCOL',
      );
    }
    const protocol = await this.protocolsRepo.findOneOrFail(protocolId);
    protocol.assign(
      user,
      assigneeDtos.map((userDto: UserDto) => userDto.toEntity()),
    );
    await this.protocolsRepo.save(protocol);

    return { status: ACCEPTED_RESPONSE_STATUS };
  }

  @Post(':protocol/assignees')
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['assignee'] },
      groups: ['assignee'],
    }),
  )
  async addAssignee(
    @Param('protocol') protocolId: string,
    @Body() assigneeDto: UserDto,
    @InjectUser() actor: User,
  ): Promise<AcceptedResponse> {
    this.checkIfCanEditAssignees(actor, assigneeDto.id);
    const protocol = await this.protocolsRepo.findOneOrFail(protocolId);
    if (protocol.assignees.length > 0) {
      throw new BadRequestException(
        'CANNOT_ASSIGN_MORE_THAN_ONE_PERSON_TO_PROTOCOL',
      );
    }
    protocol.assign(actor, [...protocol.assignees, assigneeDto.toEntity()]);
    await this.protocolsRepo.save(protocol);

    return { status: ACCEPTED_RESPONSE_STATUS };
  }

  @Delete(':protocol/assignees/:assignee')
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['assignee'] },
      groups: ['assignee'],
    }),
  )
  async deleteAssignee(
    @Param('protocol') protocolId: string,
    @Param('assignee') assigneeId: string,
    @InjectUser() actor: User,
  ): Promise<AcceptedResponse> {
    this.checkIfCanEditAssignees(actor, assigneeId);

    const protocol = await this.protocolsRepo.findOneOrFail(protocolId);
    const assigneeToBeDeleted = await this.usersRepo.findOneOrFail(assigneeId);

    this.workQueue.unassignFromProtocol(actor, protocol, assigneeToBeDeleted);

    return { status: ACCEPTED_RESPONSE_STATUS };
  }

  private checkIfCanEditAssignees(actor: User, assigneeId: string): boolean {
    // If the assignee is the actor, allow to edit
    // If not, check if actor can manage the protocol
    if (actor.id === assigneeId) {
      return true;
    }

    const ability = this.caslAbilityFactory.createForUser(actor);
    if (ability.can(Action.Manage, Protocol)) {
      return true;
    }

    throw new ForbiddenException('Cannot change assignments for others users!');
  }
}
