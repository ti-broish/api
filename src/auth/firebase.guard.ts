import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "./decorators/Public.decorator";

/**
 * All controllers use this authentication guard by default.
 * Only if routes are explicitly marked as public with the @Public() annnotation, they are skipped.
 *
 * https://docs.nestjs.com/security/authentication#enable-authentication-globally
 */
@Injectable()
export class FirebaseGuard extends AuthGuard('firebase') {
  constructor(private reflector: Reflector) {
    super(reflector);
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
