import { CityRegionResultsDto } from "./city-region-results.dto";

export class TownResultsDto {
  name: string;

  districts: Map<string, Pick<CityRegionResultsDto, 'name' | 'sections'>>;
}
