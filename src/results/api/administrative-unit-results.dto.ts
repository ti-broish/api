import { BreadcrumbDto } from "./breadcrumb.dto";
import { CityRegionResultsDto } from "./city-region-results.dto";
import { TownResultsDto } from "./town-results.dto";

export class AdmUnitResultsDto {
  name: string;

  results: number[];

  districts: Map<string, Pick<CityRegionResultsDto, 'name' | 'sections'>>;

  towns: TownResultsDto[];

  validVotes: number;

  invalidVotes: number;

  voters: number;

  abroad: boolean = false;

  crumbs: BreadcrumbDto[];
}
