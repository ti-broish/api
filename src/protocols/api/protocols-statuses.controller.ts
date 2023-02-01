import { Ability } from '@casl/ability'
import {
  Controller,
  Get,
  HttpCode,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common'
import { Action } from 'src/casl/action.enum'
import { CheckPolicies } from 'src/casl/check-policies.decorator'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { Protocol, ProtocolStatus } from '../entities/protocol.entity'
import { ProtocolDto } from './protocol.dto'

@Controller('protocols/statuses')
export class ProtocolsStatusesController {
  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Manage, Protocol))
  @UsePipes(new ValidationPipe({ transform: true }))
  index(): ProtocolDto[] {
    const result: ProtocolDto[] = []

    Object.values(ProtocolStatus).forEach((status: ProtocolStatus) => {
      const v = new ProtocolDto()
      v.status = status
      result.push(v)
    })

    return result
  }
}
