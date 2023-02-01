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
import { Protocol, ProtocolOrigin } from '../entities/protocol.entity'

interface OriginResponse {
  [key: string]: string
}

@Controller('protocols/origins')
export class ProtocolsOriginsController {
  constructor(private readonly i18n: I18nService) {}

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Manage, Protocol))
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(): Promise<OriginResponse[]> {
    return await Promise.all(
      Object.keys(ProtocolOrigin).map((originKey) =>
        this.formatOrigin(originKey, ProtocolOrigin[originKey]),
      ),
    )
  }

  private async formatOrigin(
    originKey: string,
    originValue: string,
  ): Promise<OriginResponse> {
    return {
      origin: originValue,
      originLocalized: await this.i18n.translate(
        `origin.PROTOCOL_${originKey}`,
      ),
    } as OriginResponse
  }
}
