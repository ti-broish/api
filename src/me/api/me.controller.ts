import { Ability } from '@casl/ability';
import { Controller, Get, HttpCode, Delete, Patch, Body, UsePipes, ValidationPipe, ConflictException, UseGuards } from '@nestjs/common';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { ProtocolsRepository } from '../../protocols/entities/protocols.repository';
import { User } from '../../users/entities/user.entity';
import { UsersRepository } from '../../users/entities/users.repository';
import { UserDto } from '../../users/api/user.dto';
import * as admin from 'firebase-admin';
import { ViolationsRepository } from 'src/violations/entities/violations.repository';

@Controller('me')
export class MeController {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly protocolsRepo: ProtocolsRepository,
    private readonly violationsRepo: ViolationsRepository,
  ) {}

  @Get()
  @HttpCode(200)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: Ability) => ability.can(Action.Read, User))
  async get(@InjectUser() user: User): Promise<UserDto> {
    return UserDto.fromEntity(user, [UserDto.READ, UserDto.ME_READ]);
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

  @Delete()
  @HttpCode(202)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: Ability) => ability.can(Action.Delete, User))
  async delete(@InjectUser() user: User): Promise<void> {
    const submittedProtocols = await this.protocolsRepo.findByAuthor(user);
    const submittedViolations = await this.violationsRepo.findByAuthor(user);

    if (submittedProtocols.length > 0 || submittedViolations.length > 0) {
      throw new ConflictException('CANNOT_DELETE_USER_WITH_PROTOCOLS_OR_VIOLATIONS');
    }

    const firebaseUid = user.firebaseUid;
    await this.usersRepo.delete(user.id);
    await admin.auth().deleteUser(firebaseUid);
  }
}
