import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FirebaseUser } from '@tfarras/nestjs-firebase-admin';

export const InjectFirebaseUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): FirebaseUser|null => {
    const request = ctx.switchToHttp().getRequest();

    return request.firebaseUser;
  },
);
