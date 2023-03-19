import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { firstValueFrom, Observable } from 'rxjs'
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
    const handler = context.getHandler()
    const contextClass = context.getClass()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      contextClass,
    ])

    let guardResultOrPromise = super.canActivate(context)

    if (typeof guardResultOrPromise === 'boolean') {
      return isPublic || guardResultOrPromise
    }

    if (guardResultOrPromise instanceof Observable) {
      guardResultOrPromise = firstValueFrom(guardResultOrPromise)
    }

    return guardResultOrPromise.catch((reason: Error) => {
      if (reason instanceof UnauthorizedException) {
        return isPublic
      }

      throw reason
    })
  }
}
