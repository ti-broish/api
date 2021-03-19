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

  async register(
    firebaseUser: FirebaseUser|null,
    userDto: UserDto
  ): Promise<User> {
    const userSignup = userDto.toEntity();

    if (userSignup.firebaseUid !== firebaseUser.uid) {
      throw new RegistrationError(
        'RegistrationForbiddenError',
        'Trying to sign up with firebase UID different than the auth token'
      );
    }

    if (userSignup.email !== firebaseUser.email) {
      throw new RegistrationError(
        'RegistrationForbiddenError',
        `Trying to sign up with email ${userSignup.email} different than the auth token email ${firebaseUser.email}`
      );
    }

    if (await this.repo.findByEmail(userSignup.email)) {
      throw new RegistrationError('RegistrationError', 'User email already exists');
    }

    const user = await this.repo.save(userSignup);

    return user;
  }
}
