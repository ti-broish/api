import { Ability } from '@casl/ability'
import {
  Controller,
  Get,
  HttpCode,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import { Action } from 'src/casl/action.enum'
import { CheckPolicies } from 'src/casl/check-policies.decorator'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { Role } from 'src/casl/role.enum'
import { User } from '../entities'

interface RoleResponse {
  [key: string]: string
}

@Controller('users/roles')
export class UsersRolesController {
  constructor(private readonly i18n: I18nService) {}

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Manage, User))
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(): Promise<RoleResponse[]> {
    return await Promise.all(
      Object.keys(Role).map((roleKey) =>
        this.formatRole(roleKey, Role[roleKey]),
      ),
    )
  }

  private async formatRole(
    roleKey: string,
    roleValue: string,
  ): Promise<RoleResponse> {
    return {
      role: roleValue,
      roleLocalized: await this.i18n.translate(
        `role.ROLE_${roleKey.toUpperCase()}`,
      ),
    } as RoleResponse
  }
}
