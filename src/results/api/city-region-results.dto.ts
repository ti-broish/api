import { Exclude, Expose, plainToClass, Transform, TransformOptions } from "class-transformer";
import { CityRegion, Town } from "src/sections/entities";
import { BreadcrumbDto } from "./breadcrumb.dto";
import { SectionResultsDto } from "./section-results.dto";
import { StatsDto } from "./stats.dto";
import { TownResultsDto } from "./town-results.dto";

@Exclude()
export class CityRegionResultsDto {
  @Expose({ groups: ['list', 'details'] })
  name: string;

  @Expose({ groups: ['list', 'details'] })
  results: number[];

  @Expose({ groups: ['townsList'] })
  @Transform(({ value: towns = [], options }: { value: Town[], options: TransformOptions }): Map<string, TownResultsDto> => {
    return towns.reduce((acc: any, town: Town): Map<string, TownResultsDto> => {
      acc[town.code] = TownResultsDto.fromEntity(town, options);
      return acc;
    }, new Map<string, TownResultsDto>())
  })
  towns: Map<string, TownResultsDto>;

  @Expose({ groups: ['list', 'details'] })
  sections: Map<string, SectionResultsDto>;

  addresses: Map<string, AddressDto>;

  @Expose({ groups: ['list', 'details'] })
  abroad: boolean = false;

  @Expose({ groups: ['details'] })
  crumbs: BreadcrumbDto[];

  @Expose({ groups: ['list', 'details'] })
  stats: StatsDto = new StatsDto();

  public static fromEntity(cityRegion: CityRegion, options: TransformOptions): CityRegionResultsDto {
    const cityRegionDto = plainToClass<CityRegionResultsDto, Partial<CityRegion>>(CityRegionResultsDto, cityRegion, options);

    return cityRegionDto;
  }
}
