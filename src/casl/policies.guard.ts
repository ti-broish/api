import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { User } from 'src/users/entities'
import { AppAbility, CaslAbilityFactory } from './casl-ability.factory'
import { CHECK_POLICIES_KEY } from './check-policies.decorator'
import { PolicyHandler } from './policy.handler'

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || []

    const { user }: { user: User | null } = context.switchToHttp().getRequest()
    const ability = this.caslAbilityFactory.createForUser(user)

    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    )
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability)
    }
    return handler.handle(ability)
  }
}
