import { Inject, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt } from 'passport-jwt'
import { Request } from 'express'
import { FirebaseUser, FirebaseAuthStrategy } from '../firebase'
import { UsersRepository } from '../users/entities/users.repository'
import { User } from '../users/entities/user.entity'

@Injectable()
export class FirebaseStrategy extends PassportStrategy(
  FirebaseAuthStrategy,
  'firebase',
) {
  public constructor(
    @Inject(UsersRepository) private readonly usersRepo: UsersRepository,
  ) {
    super({
      extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
    })
  }

  async validate(
    firebaseUser: FirebaseUser,
    req?: Request,
  ): Promise<User | undefined> {
    req.firebaseUser = firebaseUser ?? null

    const user =
      (await this.usersRepo.findByFirebaseUid(firebaseUser.uid)) ?? undefined

    if (user && firebaseUser.email_verified !== user.isEmailVerified) {
      user.isEmailVerified = firebaseUser.email_verified
      void this.usersRepo.save(user)
    }

    return user
  }
}
