import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common'
import { Public } from 'src/auth/decorators'
import { Action } from 'src/casl/action.enum'
import { AppAbility } from 'src/casl/casl-ability.factory'
import { CheckPolicies } from 'src/casl/check-policies.decorator'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { ElectionRegion } from '../entities'
import { ElectionRegionsRepository } from '../entities/electionRegions.repository'
import { ElectionRegionDto } from './electionRegion.dto'

@Controller('election_regions')
export class ElectionRegionsController {
  constructor(private readonly repo: ElectionRegionsRepository) {}

  @Get()
  @HttpCode(200)
  @Public()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ElectionRegion),
  )
  async index(): Promise<ElectionRegionDto[]> {
    return (await this.repo.findAllWithMunicipalities()).map(
      ElectionRegionDto.fromEntity,
    )
  }
}
