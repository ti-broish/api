import { Controller, Get, HttpCode } from '@nestjs/common';
import { ElectionRegionsRepository } from '../entities/electionRegions.repository';
import { ElectionRegionDto } from './electionRegion.dto';

@Controller('election_regions')
export class ElectionRegionsController {

  constructor(private readonly repo: ElectionRegionsRepository) {}

  @Get()
  @HttpCode(200)
  async index(): Promise<ElectionRegionDto[]> {
    return (await this.repo.findAllWithMunicipalities()).map(ElectionRegionDto.fromEntity);
  }
}
