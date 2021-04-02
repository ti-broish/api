import { ClassTransformOptions } from "@nestjs/common/interfaces/external/class-transform-options.interface";
import { Exclude, Expose, plainToClass, Transform, TransformOptions, Type } from "class-transformer";
import { CityRegion, Country, Municipality, Town } from "src/sections/entities";
import { BreadcrumbDto } from "./breadcrumb.dto";
import { CityRegionResultsDto } from "./city-region-results.dto";
import { StatsDto } from "./stats.dto";
import { TownResultsDto } from "./town-results.dto";

@Exclude()
export class AdmUnitResultsDto {
  @Expose({ groups: ['list', 'details'] })
  name: string;

  @Expose({ groups: ['list', 'details'] })
  results: number[] = [];

  @Expose({ name: 'cityRegions', groups: ['list', 'details'] })
  @Transform(({ value: districts, options }: { value: Record<string, CityRegion>, options: ClassTransformOptions }) => {
    Object.entries(districts)
      .forEach(([, district]) => {
        district.towns = (district.towns || []).reduce((acc: any, town: Town) => {
          acc[town.code] = TownResultsDto.fromEntity(town, options);
          return acc;
        }, {});
      })
    return districts;
  }, { groups: ['list', 'details'] })
  districts: Map<string, Pick<CityRegionResultsDto, 'name' | 'towns'>>;

  @Expose({ groups: ['list', 'details'] })
  abroad: boolean = false;

  @Expose({ groups: ['details'] })
  crumbs: BreadcrumbDto[] = [];

  @Expose({ groups: ['list', 'details'] })
  stats: StatsDto = new StatsDto();

  public static fromEntity(admUnit: Municipality | Country, groups: string[] = ['list']): AdmUnitResultsDto {
    if (Object.keys(admUnit.cityRegions).length === 0) {
      admUnit.cityRegions = {'00': new CityRegion(null, '00', admUnit.towns)};
    }
    const admUnitDto = plainToClass<AdmUnitResultsDto, Partial<Municipality | Country>>(AdmUnitResultsDto, admUnit, {
      groups,
    });

    return admUnitDto;
  }
}
