import { Exclude, Expose, plainToClass, Transform, TransformOptions } from "class-transformer";
import { Country, ElectionRegion, Municipality } from "src/sections/entities";
import { AdmUnitResultsDto } from "./administrative-unit-results.dto";
import { StatsDto } from "./stats.dto";

@Exclude()
export class ElectionRegionResultsDto {
  @Expose({ name: 'code', groups: ['list', 'details'] })
  @Transform(({value: number}: {value: string}) => parseInt(number, 10))
  number: number;

  @Expose({ groups: ['list', 'details'] })
  name: string;

  @Expose({ groups: ['list', 'details'] })
  results: number[] = [];

  @Expose({ groups: ['details'] })
  admUnits: Record<string, AdmUnitResultsDto>;

  @Expose({ name: 'isAbroad', groups: ['list'] })
  abroad: boolean = false;

  @Expose({ groups: ['list', 'details'] })
  stats: StatsDto = new StatsDto();

  public static fromEntity(electionRegion: ElectionRegion, groups: string[] = ['list']): ElectionRegionResultsDto {
    const electionRegionDto = plainToClass<ElectionRegionResultsDto, Partial<ElectionRegion>>(ElectionRegionResultsDto, electionRegion, {
      // exposeDefaultValues: true,
      groups,
    });

    electionRegionDto.admUnits = null;
    if (groups.includes('details')) {
      const admUnits = (electionRegion.isAbroad ? electionRegion.countries : electionRegion.municipalities) as Array<Country | Municipality>;
      electionRegionDto.admUnits = admUnits.reduce((acc: any, unit: Municipality | Country) => {
        acc[unit.code] = AdmUnitResultsDto.fromEntity(unit);
        return acc;
      }, {});
    }

    return electionRegionDto;
  }
}
