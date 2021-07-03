import { Exclude, Expose, Type } from 'class-transformer';
import { Party } from 'src/parties/entities/party.entity';
import { ElectionRegion } from 'src/sections/entities';
import { ElectionRegionResultsDto } from './election-region-results.dto';
import { PartyDto } from './party.dto';
import { StatsDto } from './stats.dto';

export enum ElectionType {
  PARLIAMENT = 'national-parliament',
}

@Exclude()
export class TotalResultsDto {
  @Expose()
  name: string;

  @Expose()
  electionType: ElectionType;

  @Expose()
  results: number[] = [];

  @Expose()
  @Type(() => PartyDto)
  parties: PartyDto[];

  @Expose()
  regions: Record<string, Omit<ElectionRegionResultsDto, 'admUnits'>>;

  @Expose()
  stats: StatsDto = new StatsDto();

  public static create(
    electionType: ElectionType,
    parties: Party[],
    electionRegions: ElectionRegion[],
  ): TotalResultsDto {
    const total = new TotalResultsDto();
    total.electionType = electionType;
    total.parties = parties.map(
      (party: Party): PartyDto => PartyDto.fromEntity(party),
    );

    total.regions = electionRegions.reduce(
      (
        acc: any,
        electionRegion: ElectionRegion,
      ): Record<string, Partial<ElectionRegionResultsDto>> => {
        const electionRegionDto =
          ElectionRegionResultsDto.fromEntity(electionRegion);
        acc[electionRegion.id] = electionRegionDto;
        return acc;
      },
      {},
    );

    return total;
  }
}
