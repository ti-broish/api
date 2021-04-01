import { PickType } from "@nestjs/swagger";
import { SectionDetailsResultDto } from "./section-details-result.dto";

export class SectionResultsDto extends PickType(SectionDetailsResultDto, [
  'results',
  'validVotes',
  'invalidVotes',
  'voters'
] as const) {
}
