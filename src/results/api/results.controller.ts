import { Controller, Get, HttpCode, Param, ValidationPipe, UsePipes, NotFoundException } from '@nestjs/common';
import { Public } from 'src/auth/decorators';
import { ElectionRegion } from 'src/sections/entities';
import { ElectionRegionsRepository } from 'src/sections/entities/electionRegions.repository';
import { CityRegionResultsDto } from './city-region-results.dto';
import { ElectionRegionResultsDto } from './election-region-results.dto';
import { AdmUnitResultsDto } from './administrative-unit-results.dto';
import { SectionResultsDto } from './section-results.dto';
import { ElectionType, TotalResultsDto } from './total-results.dto';
import { PartyDto } from './party.dto';
import { PartiesRepository } from 'src/parties/entities/parties.repository';
import { Party } from 'src/parties/entities/party.entity';

@Controller('results')
@Public()
export class ResultsController {
  constructor(
    private readonly electionRegionsRepo: ElectionRegionsRepository,
    private readonly partiesRepo: PartiesRepository,
  ) {}

  @Get()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async all(): Promise<TotalResultsDto> {
    const total = new TotalResultsDto();
    total.electionType = ElectionType.PARLIAMENT;
    total.parties = (await this.partiesRepo.findAllForResults())
      .map((party: Party): PartyDto => PartyDto.fromEntity(party));
    total.regions = (await this.electionRegionsRepo.findAll())
      .map((electionRegion: ElectionRegion) => ElectionRegionResultsDto.fromEntity(electionRegion))
      .reduce((acc: any, electionRegion: Partial<ElectionRegionResultsDto>): Map<string, Partial<ElectionRegionResultsDto>> => {
        console.log(electionRegion);
        acc[electionRegion.number] = electionRegion;
        return acc;
      }, {});

    return total;
  }

  @Get(':id')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async subset(
    @Param('id') id: string
  ): Promise<
    ElectionRegionResultsDto |
    AdmUnitResultsDto |
    CityRegionResultsDto |
    SectionResultsDto
  > {
    if (!id.match(/^\d{2}(\d{2}(\d{2}(\d{3})?)?)?$/)) {
      throw new NotFoundException();
    }

    if (id.match(/^\d{2}$/)) {
      return this.getElectionRegionResults(id);
    }

    if (id.match(/^\d{4}$/)) {
      return this.getCountryOrMunicipalityResults(id);
    }

    if (id.match(/^\d{6}$/)) {
      return this.getCityRegionResults(id);
    }

    return this.getSectionResults(id);
  }

  private async getElectionRegionResults(id: string): Promise<ElectionRegionResultsDto> {
    return ElectionRegionResultsDto.fromEntity(await this.getElectionRegion(id));
  }

  private async getCountryOrMunicipalityResults(id: string): Promise<AdmUnitResultsDto> {
    const electionRegion = await this.getElectionRegion(id);
    if (electionRegion.isAbroad) {
      return this.getCountryResults(id.replace(/^\d{2}(\d{2})/, '$1'));
    }

    return this.getMunicipalityResults(id);
  }

  private async getMunicipalityResults(id: string): Promise<AdmUnitResultsDto> {
    return new AdmUnitResultsDto();
  }

  private async getCountryResults(id: string): Promise<AdmUnitResultsDto> {
    return new AdmUnitResultsDto();
  }

  private async getCityRegionResults(id: string): Promise<CityRegionResultsDto> {
    return new CityRegionResultsDto();
  }

  private async getSectionResults(id: string): Promise<SectionResultsDto> {
    return new SectionResultsDto();
  }

  private async getElectionRegion(id: string): Promise<ElectionRegion> {
    return this.electionRegionsRepo.findOneOrFail(id);
  }
}
