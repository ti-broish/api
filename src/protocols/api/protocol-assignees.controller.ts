import { Ability } from '@casl/ability';
import { Controller, Get, Post, HttpCode, Param, Body, ValidationPipe, UsePipes, Inject, UseGuards, Put, ParseArrayPipe, Delete, NotFoundException } from '@nestjs/common';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { UserDto } from 'src/users/api/user.dto';
import { UsersRepository } from 'src/users/entities/users.repository';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { User } from '../../users/entities';
import { Protocol } from '../entities/protocol.entity';
import { ProtocolsRepository } from '../entities/protocols.repository';

@Controller('protocols')
export class ProtocolAssigneesController {
  constructor(
    @Inject(ProtocolsRepository) private readonly protocolsRepo: ProtocolsRepository,
    @Inject(UsersRepository) private readonly usersRepo: UsersRepository,
  ) {}

  @Get(':protocol/assignees')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  async getAssignees( @Param('protocol') protocolId: string ): Promise<UserDto[]> {
    const protocol = await this.protocolsRepo.findOneOrFail(protocolId);

    return protocol.assignees.map((user: User) => UserDto.fromEntity(user));
  }

  @Put(':protocol/assignees')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['assignee'] }, groups: ['assignee'] }))
  async putAssignees(
    @Param('protocol') protocolId: string,
    @Body(new ParseArrayPipe({ items: UserDto, transformOptions: { groups: ['assignee'] }, groups: ['assignee'] })) assigneeDtos: UserDto[],
    @InjectUser() user: User,
  ): Promise<object> {
    const protocol = await this.protocolsRepo.findOneOrFail(protocolId);
    protocol.assign(user, assigneeDtos.map((userDto: UserDto) => userDto.toEntity()));
    await this.protocolsRepo.save(protocol);

    return {'status': 'Accepted'};
  }

  @Post(':protocol/assignees')
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['assignee'] }, groups: ['assignee'] }))
  async addAssignee(
    @Param('protocol') protocolId: string,
    @Body() assigneeDto: UserDto,
    @InjectUser() actor: User,
  ): Promise<object> {
    const protocol = await this.protocolsRepo.findOneOrFail(protocolId);
    protocol.assign(actor, [...protocol.assignees, assigneeDto.toEntity()]);
    await this.protocolsRepo.save(protocol);

    return {'status': 'Accepted'};
  }


  @Delete(':protocol/assignees/:assignee')
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['assignee'] }, groups: ['assignee'] }))
  async deleteAssignee(
    @Param('protocol') protocolId: string,
    @Param('assignee') assigneeId: string,
    @InjectUser() user: User,
  ): Promise<object> {
    const protocol = await this.protocolsRepo.findOneOrFail(protocolId);
    const assigneeToBeDeleted = await this.usersRepo.findOneOrFail(assigneeId);
    const assignees = protocol.assignees;
    const foundIndex = assignees.findIndex((user: User) => user.id === assigneeToBeDeleted.id);
    if (foundIndex < 0) {
      throw new NotFoundException('ASSIGNEE_NOT_FOUND');
    }
    assignees.splice(foundIndex, 1);
    protocol.assign(user, assignees);
    await this.protocolsRepo.save(protocol);

    return {'status': 'Accepted'};
  }
}
