import { Exclude, Expose, Type } from "class-transformer";
import { ElectionRegionResultsDto } from "./election-region-results.dto";
import { PartyDto } from "./party.dto";
import { StatsDto } from "./stats.dto";

export enum ElectionType {
  PARLIAMENT = 'national-parliament',
};

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
  regions: Map<string, Omit<ElectionRegionResultsDto, 'admUnits'>>;

  @Expose()
  validVotes: number = null;

  @Expose()
  invalidVotes: number = null;

  @Expose()
  voters: number = null;

  @Expose()
  stats: StatsDto = new StatsDto();
}
