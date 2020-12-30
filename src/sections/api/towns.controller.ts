import { BadRequestException, Controller, Get, HttpCode, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Town } from '../entities';
import { TownsRepository } from '../entities/towns.repository';
import { TownDto } from './town.dto';

@Controller('towns')
export class TownsController {

  constructor(private readonly repo: TownsRepository) {}

  @Get()
  @HttpCode(200)
  @ApiQuery({
    name: "country",
    description: "The country code to filter by",
    required: true,
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
    if (!countryCode) {
      throw new BadRequestException('Query parameter "country" is required!');
    }
    if (electionRegionCode && !municipalityCode) {
      throw new BadRequestException('Query parameter "municipality" is required when "election_region" is provided!');
    }
    const towns: Town[] = await this.repo.filter(countryCode, electionRegionCode, municipalityCode)

    return towns.map(TownDto.fromEntity);
  }
}
