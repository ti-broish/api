import { PickType } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { SectionDetailsResultDto } from "./section-details-result.dto";
import { StatsDto } from "./stats.dto";

export class SectionResultsDto extends PickType(SectionDetailsResultDto, [
  'results',
  'validVotes',
  'invalidVotes',
  'voters'
] as const) {

  @Expose()
  stats: Pick<StatsDto, 'protocolsReceived' | 'protocolsValidated'>;
}
