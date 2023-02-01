import { Ability } from '@casl/ability'
import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { Action } from 'src/casl/action.enum'
import { CheckPolicies } from 'src/casl/check-policies.decorator'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { Country } from '../entities'
import { CountriesRepository } from '../entities/countries.repository'
import { CountryDto } from './country.dto'

@Controller('countries')
export class CountriesController {
  constructor(private readonly repo: CountriesRepository) {}

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Country))
  @ApiResponse({
    status: 200,
    description: 'Successful index of all countries',
  })
  async index(): Promise<CountryDto[]> {
    return (await this.repo.findAll()).map(CountryDto.fromEntity)
  }
}
