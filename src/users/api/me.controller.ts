import { Controller, Get, HttpCode, Delete, Inject, Patch, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectUser } from 'src/auth/decorators/injectUser.decorator';
import { User } from '../entities/user.entity';
import { UsersRepository } from '../entities/users.repository';
import { UserDto } from './user.dto';

@Controller('me')
export class MeController {
  constructor( @Inject(UsersRepository) private readonly usersRepo: UsersRepository) { }

  @Get()
  @HttpCode(200)
  async get(@InjectUser() user: User): Promise<UserDto> {
    return UserDto.fromEntity(user);
  }

  @Patch()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: [UserDto.UPDATE] }, groups: [UserDto.UPDATE], skipMissingProperties: true }))
  async patch(@InjectUser() user: User, @Body() userDto: UserDto): Promise<UserDto> {
    const updatedUser = await this.usersRepo.update(userDto.updateEntity(user));

    return UserDto.fromEntity(updatedUser);
  }

  @Delete()
  @HttpCode(202)
  async delete(@InjectUser() user: User): Promise<void> {
    // TODO: delete only if no protocols are submitted by this user
    await this.usersRepo.delete(user.id);
  }
}
