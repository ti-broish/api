import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User } from '../../users/entities'

export const InjectUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User | undefined => {
    const { user }: { user: User | undefined } = ctx.switchToHttp().getRequest()

    return user
  },
)
