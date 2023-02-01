import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User } from '../../users/entities'

export const InjectUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User | null => {
    const { user }: { user: User | null } = ctx.switchToHttp().getRequest()

    return user
  },
)
