import { Ability } from '@casl/ability';
import { Controller, Get, HttpCode, Body, UsePipes, ValidationPipe, Post, UseGuards } from '@nestjs/common';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { ClientsRepository } from '../../users/entities/clients.repository';
import { User } from '../../users/entities/user.entity';
import { ClientDto } from '../../users/api/client.dto';

@Controller('me/clients')
export class MeClientsController {
  constructor(private readonly clientsRepo: ClientsRepository) {}

  @Get()
  @HttpCode(200)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: Ability) => ability.can(Action.Read, Client))
  async index(@InjectUser() user: User): Promise<ClientDto[]> {
    return (await this.clientsRepo.findAllForOwners([user])).map(ClientDto.fromEntity);
  }

  @Post()
  @HttpCode(201)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: Ability) => ability.can(Action.Create, Client))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['create'] }, groups: ['create'] }))
  async create(
    @InjectUser() user: User,
    @Body() clientDto: ClientDto
  ): Promise<ClientDto> {
    const client = clientDto.toEntity();
    client.activate();
    client.owner = user;

    return ClientDto.fromEntity(await this.clientsRepo.save(client));
  }
}
