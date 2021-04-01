import { Logger } from '@nestjs/common';
import { JwtFromRequestFunction } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-strategy';
import { Request } from 'express';
import * as admin from 'firebase-admin';
import { FirebaseAuthStrategyOptions, FirebaseUser, FIREBASE_AUTH, UNAUTHORIZED } from '.';

export class FirebaseAuthStrategy extends PassportStrategy(Strategy, 'firebase-auth') {
  readonly name = FIREBASE_AUTH;
  private checkRevoked = false;
  private passReqToCallback = false;

  constructor(
    options: FirebaseAuthStrategyOptions,
    private extractor: JwtFromRequestFunction,
    private logger = new Logger(FirebaseAuthStrategy.name),
  ) {
    super();

    if (!options.extractor) {
      throw new Error('\n Extractor is not a function. You should provide an extractor. \n Read the docs: https://github.com/tfarras/nestjs-firebase-auth#readme');
    }

    this.extractor = options.extractor;
    this.checkRevoked = options.checkRevoked === true || false;
    this.passReqToCallback = options.passReqToCallback === true || false;
  }

  async validate(payload: FirebaseUser, req?: Request): Promise<any> {
    return payload;
  }

  authenticate(req: Request): void {
    const idToken = this.extractor(req);

    if (!idToken) {
      this.fail(UNAUTHORIZED, 401);

      return;
    }

    try {
      admin.auth()
        .verifyIdToken(idToken, this.checkRevoked)
        .then((res) => this.validateDecodedIdToken(res, this.passReqToCallback ? req : undefined))
        .catch((err) => {
          this.fail({ err }, 401);
        });
    }
    catch (e) {
      this.logger.error(e);

      this.fail(e, 401);
    }
  }

  private async validateDecodedIdToken(decodedIdToken: FirebaseUser, req?: Request) {
    const result = this.passReqToCallback
      ? await this.validate(decodedIdToken, req)
      : await this.validate(decodedIdToken);

    if (result) {
      this.success(result);
    }

    this.fail(UNAUTHORIZED, 401);
  }
}
