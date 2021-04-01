import { Expose } from "class-transformer";
import { BreadcrumbDto } from "./breadcrumb.dto";
import { SectionResultsDto } from "./section-results.dto";
import { StatsDto } from "./stats.dto";
import { TownResultsDto } from "./town-results.dto";

export class CityRegionResultsDto {
  name: string;

  results: number[];

  towns: Map<string, TownResultsDto>;

  sections: Map<string, SectionResultsDto>;

  addresses: Map<string, AddressDto>;

  validVotes: number;

  invalidVotes: number;

  voters: number;

  abroad: boolean = false;

  crumbs: BreadcrumbDto[];

  @Expose()
  stats: StatsDto = new StatsDto();
}
