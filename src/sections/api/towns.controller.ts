import { Controller, Get, HttpCode, HttpException, HttpStatus, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Town } from '../entities';
import { TownsRepository } from '../entities/towns.repository';
import { MunicipalityDto } from './municipality.dto';
import { TownDto } from './town.dto';

@Controller('towns')
export class TownsController {

  constructor(private readonly repo: TownsRepository) {}

  @Get()
  @HttpCode(200)
  @ApiQuery({
    name: "country",
    description: "The country code to filter by",
    required: false,
    type: String,
  })
  @ApiQuery({
    name: "election_region",
    description: "The election region code to filter by",
    required: false,
    type: String,
  })
  @ApiQuery({
    name: "municipality",
    description: "The municipality code to filter by",
    required: false,
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Successful query of towns'})
  @ApiResponse({ status: 400, description: 'Invalid query parameters'})
  async query(
    @Query('country') countryCode?: string,
    @Query('election_region') electionRegionCode?: string,
    @Query('municipality') municipalityCode?: string,
  ): Promise<TownDto[]> {
    if (!countryCode && !(electionRegionCode && municipalityCode)) {
      throw new HttpException('Invalid query parameters!', HttpStatus.BAD_REQUEST);
    }
    const towns: Town[] = countryCode
      ? await this.repo.findByCountry(countryCode)
      : await this.repo.findByMunicipality(electionRegionCode, municipalityCode);

    return towns.map(TownDto.fromEntity);
  }
}
