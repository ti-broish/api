import { Ability } from '@casl/ability';
import { Controller, Get, HttpCode, Delete, Inject, Patch, Body, UsePipes, ValidationPipe, ConflictException, Post, UseGuards } from '@nestjs/common';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { PictureDto } from 'src/pictures/api/picture.dto';
import { ProtocolFilters } from 'src/protocols/api/protocols-filters.dto';
import { Protocol } from 'src/protocols/entities/protocol.entity';
import { Violation } from 'src/violations/entities/violation.entity';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { PicturesUrlGenerator } from '../../pictures/pictures-url-generator.service';
import { ProtocolDto } from '../../protocols/api/protocol.dto';
import { ProtocolsRepository } from '../../protocols/entities/protocols.repository';
import { ViolationDto } from '../../violations/api/violation.dto';
import { ViolationsRepository } from '../../violations/entities/violations.repository';
import { Client } from '../../users/entities/client.entity';
import { ClientsRepository } from '../../users/entities/clients.repository';
import { User } from '../../users/entities/user.entity';
import { UsersRepository } from '../../users/entities/users.repository';
import { ClientDto } from '../../users/api/client.dto';
import { UserDto } from '../../users/api/user.dto';
import * as admin from 'firebase-admin';

@Controller('me')
export class MeController {
  constructor(
    @Inject(UsersRepository) private readonly usersRepo: UsersRepository,
    @Inject(ClientsRepository) private readonly clientsRepo: ClientsRepository,
    @Inject(ProtocolsRepository) private readonly protocolsRepo: ProtocolsRepository,
    @Inject(ViolationsRepository) private readonly violationsRepo: ViolationsRepository,
    @Inject(PicturesUrlGenerator) private readonly picturesUrlGenerator: PicturesUrlGenerator,
  ) { }

  @Get()
  @HttpCode(200)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: Ability) => ability.can(Action.Read, User))
  async get(@InjectUser() user: User): Promise<UserDto> {
    return UserDto.fromEntity(user);
  }

  @Patch()
  @HttpCode(200)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: Ability) => ability.can(Action.Update, User))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: [UserDto.UPDATE] }, groups: [UserDto.UPDATE], skipMissingProperties: true }))
  async patch(@InjectUser() user: User, @Body() userDto: UserDto): Promise<UserDto> {
    const updatedUser = await this.usersRepo.update(userDto.updateEntity(user));

    return UserDto.fromEntity(updatedUser);
  }

  @Get('protocols')
  @HttpCode(200)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: Ability) => ability.can(Action.Read, Protocol))
  @UsePipes(new ValidationPipe({ transform: true }))
  async protocols(@InjectUser() user: User): Promise<ProtocolDto[]> {
    const protocols = await this.protocolsRepo.queryBuilderWithFilters({ author: user.id } as ProtocolFilters).getMany();
    return protocols.map((protocol: Protocol) : ProtocolDto => {
      const protocolDto = ProtocolDto.fromEntity(protocol);
      protocolDto.pictures.forEach(this.updatePictureUrl, this);

      return protocolDto;
    });
  }

  @Get('violations')
  @HttpCode(200)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: Ability) => ability.can(Action.Read, Violation))
  async violations(@InjectUser() user: User): Promise<ViolationDto[]> {
    const violations = (await this.violationsRepo.findByAuthor(user)).map(ViolationDto.fromEntity);
    violations.forEach(dto => dto.pictures.forEach(this.updatePictureUrl, this), this);

    return violations;
  }

  @Get('clients')
  @HttpCode(200)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: Ability) => ability.can(Action.Read, Client))
  async clients(@InjectUser() user: User): Promise<ClientDto[]> {
    return (await this.clientsRepo.findAllForOwners([user])).map(ClientDto.fromEntity);
  }

  @Post('clients')
  @HttpCode(201)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: Ability) => ability.can(Action.Create, Client))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['create'] }, groups: ['create'] }))
  async registerClient(
    @InjectUser() user: User,
    @Body() clientDto: ClientDto
  ): Promise<ClientDto> {
    const client = clientDto.toEntity();
    client.activate();
    client.owner = user;

    return ClientDto.fromEntity(await this.clientsRepo.save(client));
  }

  @Delete()
  @HttpCode(202)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: Ability) => ability.can(Action.Delete, User))
  async delete(@InjectUser() user: User): Promise<void> {
    const submittedProtocols = await this.protocolsRepo.findByAuthor(user);
    if (submittedProtocols.length > 0) {
      throw new ConflictException('CANNOT_DELETE_USER_WITH_PROTOCOLS');
    }
    const firebaseUid = user.firebaseUid;
    await this.usersRepo.delete(user.id);
    await admin.auth().deleteUser(firebaseUid);
  }

  private updatePictureUrl(picture: PictureDto): void {
    picture.url = this.picturesUrlGenerator.getUrl(picture);
  }
}
