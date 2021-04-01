import { Exclude, Expose, Type } from "class-transformer";
import { ElectionRegionResultsDto } from "./election-region-results.dto";
import { PartyDto } from "./party.dto";

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
  regions: Map<string, Pick<ElectionRegionResultsDto,
  'name'
  | 'number'
  | 'abroad'
  | 'results'
  | 'validVotes'
  | 'invalidVotes'
  | 'voters'>>;

  @Expose()
  validVotes: number = null;

  @Expose()
  invalidVotes: number = null;

  @Expose()
  voters: number = null;
}
