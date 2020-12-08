import { Controller, Post, HttpCode, Body, Inject, ValidationPipe, UsePipes, HttpException, HttpStatus } from '@nestjs/common';
import { FirebaseUser } from '@tfarras/nestjs-firebase-admin';
import { InjectUser } from '../../auth/decorators/injectUser.decorator';
import { User } from '../entities';
import RegistrationService, { RegistrationError } from './registration.service';
import { UserDto } from './user.dto';

@Controller('users')
export class UsersController {
  constructor( @Inject(RegistrationService) private readonly registration: RegistrationService) { }

  @Post()
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: [UserDto.CREATE] }, groups: [UserDto.CREATE] }))
  async create(
    @Body() userDto: UserDto,
    @InjectUser() authUser: User|FirebaseUser,
  ): Promise<UserDto> {
    try {
      const user = await this.registration.register(authUser, userDto);

      return UserDto.fromEntity(user);
    } catch (error) {
      console.error(error);
      if (error instanceof RegistrationError) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }

      throw error;
    }
  }
}
