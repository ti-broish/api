import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import { Action } from 'src/casl/action.enum';
import { AppAbility } from 'src/casl/casl-ability.factory';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { PartiesRepository } from '../entities/parties.repository';
import { Party } from '../entities/party.entity';
import { PartyDto } from './party.dto';

@Controller('parties')
export class PartiesController {
  constructor(private readonly repo: PartiesRepository) {}

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Party))
  async index(): Promise<PartyDto[]> {
    return (await this.repo.findAll()).map(PartyDto.fromEntity);
  }
}
