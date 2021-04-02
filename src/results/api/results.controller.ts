import { Controller, Get, HttpCode, Param, ValidationPipe, UsePipes, NotFoundException } from '@nestjs/common';
import { Public } from 'src/auth/decorators';
import { ElectionRegion } from 'src/sections/entities';
import { ElectionRegionsRepository } from 'src/sections/entities/electionRegions.repository';
import { MunicipalitiesRepository } from 'src/sections/entities/municipalities.repository';
import { CityRegionResultsDto } from './city-region-results.dto';
import { ElectionRegionResultsDto } from './election-region-results.dto';
import { AdmUnitResultsDto } from './administrative-unit-results.dto';
import { SectionResultsDto } from './section-results.dto';
import { ElectionType, TotalResultsDto } from './total-results.dto';
import { PartyDto } from './party.dto';
import { PartiesRepository } from 'src/parties/entities/parties.repository';
import { Party } from 'src/parties/entities/party.entity';
import { CountriesRepository } from 'src/sections/entities/countries.repository';

@Controller('results')
@Public()
export class ResultsController {
  constructor(
    private readonly electionRegionsRepo: ElectionRegionsRepository,
    private readonly partiesRepo: PartiesRepository,
    private readonly municipalitiesRepo: MunicipalitiesRepository,
    private readonly countriesRepo: CountriesRepository,
  ) {}

  @Get()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async all(): Promise<TotalResultsDto> {
    return TotalResultsDto.create(
      ElectionType.PARLIAMENT,
      await this.partiesRepo.findAllForResults(),
      await this.electionRegionsRepo.findAllWithStats(),
    );
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
    const electionRegion = await this.electionRegionsRepo.findOneWithStatsOrFail(id);

    if (electionRegion.isAbroad) {
      electionRegion.countries = await this.countriesRepo.findAllAbroadWithStats();
    } else {
      electionRegion.municipalities = await this.municipalitiesRepo.findFromElectionRegionWithCityRegionsAndStats(electionRegion.id);
    }

    return ElectionRegionResultsDto.fromEntity(electionRegion, ['list', 'details']);
  }

  private async getCountryOrMunicipalityResults(id: string): Promise<AdmUnitResultsDto> {
    const electionRegion = await this.getElectionRegion(id.replace(/^(\d{2}).*/, '$1'));
    const admUnitCode = id.replace(/^\d{2}(\d{2})/, '$1');
    if (electionRegion.isAbroad) {
      return this.getCountryResults(admUnitCode);
    }

    return this.getMunicipalityResults(electionRegion, admUnitCode);
  }

  private async getMunicipalityResults(electionRegion: ElectionRegion, id: string): Promise<AdmUnitResultsDto> {
    const municipality = await this.municipalitiesRepo.findOneWithStatsOrFail(electionRegion, id);
    const municipalityDto = AdmUnitResultsDto.fromEntity(municipality);

    municipalityDto.crumbs = [{ name: electionRegion.name, unit: electionRegion.code }];

    return municipalityDto;
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
