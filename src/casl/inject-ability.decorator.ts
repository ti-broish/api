import { Ability } from '@casl/ability';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';

export const InjectAbility = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Ability|null => {
    const { user } = ctx.switchToHttp().getRequest();
    if (!user) {
      return null;
    }

    const abilityFactory = new CaslAbilityFactory();

    return abilityFactory.createForUser(user);
  },
);
