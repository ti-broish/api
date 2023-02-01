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
import { Violation, ViolationStatus } from '../entities/violation.entity'
import { ViolationDto } from './violation.dto'

@Controller('violations/statuses')
export class ViolationStatusesController {
  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Manage, Violation))
  @UsePipes(new ValidationPipe({ transform: true }))
  index(): ViolationDto[] {
    const result: ViolationDto[] = []

    Object.values(ViolationStatus).forEach((status: ViolationStatus) => {
      const v = new ViolationDto()
      v.status = status
      result.push(v)
    })

    return result
  }
}
