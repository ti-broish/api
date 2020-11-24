import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt } from 'passport-jwt';
import { FirebaseAuthStrategy, FirebaseUser } from '@tfarras/nestjs-firebase-auth';
import { FirebaseAdminSDK, FIREBASE_ADMIN_INJECT } from "@tfarras/nestjs-firebase-admin";
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(FirebaseAuthStrategy, 'firebase') {
  public constructor(@Inject(FIREBASE_ADMIN_INJECT) private readonly fireSDK: FirebaseAdminSDK) {
    super({
      extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
    admin.initializeApp();
  }

  async validate(payload: FirebaseUser): Promise<FirebaseUser> {
    // TODO: validate user exists in the database
    console.log(payload);
    return payload;
  }
}
