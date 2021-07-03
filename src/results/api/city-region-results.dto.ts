import {
  Exclude,
  Expose,
  plainToClass,
  Transform,
  TransformOptions,
} from 'class-transformer';
import { CityRegion, Town } from 'src/sections/entities';
import { AddressDto } from './address.dto';
import { BreadcrumbDto } from './breadcrumb.dto';
import { SectionResultsDto } from './section-results.dto';
import { StatsDto } from './stats.dto';
import { TownResultsDto } from './town-results.dto';

@Exclude()
export class CityRegionResultsDto {
  @Expose({ groups: ['list', 'details'] })
  name: string;

  @Expose({ groups: ['list', 'details'] })
  results: number[];

  @Expose({ groups: ['townsList'] })
  @Transform(
    ({
      value: towns = [],
      options,
    }: {
      value: Town[];
      options: TransformOptions;
    }): Record<string, TownResultsDto> => {
      return towns.reduce(
        (acc: any, town: Town): Record<string, TownResultsDto> => {
          acc[town.code] = TownResultsDto.fromEntity(town, options);
          return acc;
        },
        {},
      );
    },
  )
  towns: Record<string, TownResultsDto>;

  @Expose({ groups: ['list', 'details'] })
  sections: Record<string, SectionResultsDto>;

  addresses: Record<string, AddressDto>;

  @Expose({ groups: ['list', 'details'] })
  abroad = false;

  @Expose({ groups: ['details'] })
  crumbs: BreadcrumbDto[];

  @Expose({ groups: ['list', 'details'] })
  stats: StatsDto = new StatsDto();

  public static fromEntity(
    cityRegion: CityRegion,
    options: TransformOptions,
  ): CityRegionResultsDto {
    const cityRegionDto = plainToClass<
      CityRegionResultsDto,
      Partial<CityRegion>
    >(CityRegionResultsDto, cityRegion, options);

    return cityRegionDto;
  }
}
