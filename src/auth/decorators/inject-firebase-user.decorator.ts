import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'
import { FirebaseUser } from '../../firebase'

export const InjectFirebaseUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): FirebaseUser | null => {
    const request = ctx.switchToHttp().getRequest<Request>()

    return request.firebaseUser
  },
)
