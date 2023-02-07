import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'
import { firstValueFrom, Observable } from 'rxjs'
import { ALLOW_ONLY_FIREBASE_USER } from './decorators/allow-only-firebase-user.decorator'
import { IS_PUBLIC_KEY } from './decorators/public.decorator'

/**
 * All controllers use this authentication guard by default.
 * Only if routes are explicitly marked as public with the @Public() annnotation, they are skipped.
 *
 * https://docs.nestjs.com/security/authentication#enable-authentication-globally
 */
@Injectable()
export class FirebaseGuard extends AuthGuard('firebase') {
  constructor(private reflector: Reflector) {
    super(reflector)
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    // If AllowOnlyFirebaseUser() decorator is set on controller
    // authentication would allow it if the firebase user is valid
    // even if the user does not exist in the database
    const allowOnlyFirebaseUser = !!this.reflector.getAllAndOverride<boolean>(
      ALLOW_ONLY_FIREBASE_USER,
      [context.getHandler(), context.getClass()],
    )

    let guardResultOrPromise = super.canActivate(context)

    if (!allowOnlyFirebaseUser) {
      return guardResultOrPromise
    }

    if (typeof guardResultOrPromise === 'boolean') {
      return (
        guardResultOrPromise &&
        !!context.switchToHttp().getRequest<Request>().firebaseUser
      )
    }

    if (guardResultOrPromise instanceof Observable) {
      guardResultOrPromise = firstValueFrom(guardResultOrPromise)
    }
    return guardResultOrPromise.catch((reason: Error) => {
      if (reason instanceof UnauthorizedException) {
        return !!context.switchToHttp().getRequest<Request>().firebaseUser
      }

      throw reason
    })
  }
}
