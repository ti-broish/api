import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { FirebaseAuthStrategy } from './firebase/passport-firebase.strategy';
import { FirebaseUser } from '@tfarras/nestjs-firebase-auth';
import { FirebaseAdminSDK, FIREBASE_ADMIN_INJECT } from '@tfarras/nestjs-firebase-admin';
import { Request } from 'express';
import { UsersRepository } from '../users/entities/users.repository';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(FirebaseAuthStrategy, 'firebase') {
  public constructor(
    @Inject(FIREBASE_ADMIN_INJECT) private readonly fireSDK: FirebaseAdminSDK,
    @Inject(UsersRepository) private readonly usersRepo: UsersRepository
  ) {
    super({
      extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
    });
  }

  async validate(firebaseUser: FirebaseUser, req?: Request): Promise<User | null> {
    req.firebaseUser = firebaseUser ?? null;

    const user = await this.usersRepo.findByFirebaseUid(firebaseUser.uid) ?? null;

    if (user && firebaseUser.email_verified !== user.isEmailVerified) {
      user.isEmailVerified = firebaseUser.email_verified;
      this.usersRepo.save(user);
    }

    return user;
  }
}
