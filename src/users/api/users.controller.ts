import { Controller, Post, HttpCode, Body, Inject, ValidationPipe, UsePipes, HttpException, HttpStatus } from '@nestjs/common';
import { FirebaseUser } from '@tfarras/nestjs-firebase-admin';
import { AllowOnlyFirebaseUser, InjectFirebaseUser, InjectUser } from '../../auth/decorators';
import { User } from '../entities';
import RegistrationService, { RegistrationError } from './registration.service';
import { UserDto } from './user.dto';

@Controller('users')
export class UsersController {
  constructor( @Inject(RegistrationService) private readonly registration: RegistrationService) { }

  @Post()
  @AllowOnlyFirebaseUser()
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: [UserDto.CREATE] }, groups: [UserDto.CREATE] }))
  async create(
    @Body() userDto: UserDto,
    @InjectFirebaseUser() firebaseUser: FirebaseUser,
    @InjectUser() authUser: User|undefined,
  ): Promise<UserDto> {
    try {
      if (authUser !== undefined) {
        throw new RegistrationError(
          'RegistrationForbiddenError',
          'Already authenticated as we have the Firebase UID in our records'
        );
      }
      const user = await this.registration.register(firebaseUser, userDto);

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
