import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FirebaseUser } from "@tfarras/nestjs-firebase-admin";
import { UserDto } from "./user.dto";
import { User } from "../entities";
import { UsersRepository } from "../entities/users.repository";

export class RegistrationError implements Error {
  constructor(public name: string, public message: string) {}
}

@Injectable()
export default class RegistrationService {

  public constructor(@Inject(UsersRepository) private readonly repo: UsersRepository) {}

  async register(authUser: User|FirebaseUser, userDto: UserDto): Promise<User> {
    if (authUser instanceof User) {
      throw new RegistrationError(
        'RegistrationForbiddenError',
        'Already authenticated as we have the Firebase UID in our records'
      );
    }

    const userSignup = userDto.toEntity();

    if (userSignup.firebaseUid !== authUser.uid || userSignup.email !== authUser.email) {
      throw new RegistrationError(
        'RegistrationForbiddenError',
        'Trying to sign up with data which does not match the Firebase token'
        );
      }

      if (await this.repo.findByEmail(userSignup.email)) {
      throw new RegistrationError('RegistrationError', 'User email already exists');
    }

    const user = await this.repo.save(userSignup);

    return user;
  }
}
