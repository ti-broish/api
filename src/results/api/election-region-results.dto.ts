import { Exclude, Expose, plainToClass } from "class-transformer";
import { ElectionRegion } from "src/sections/entities";
import { AdmUnitResultsDto } from "./administrative-unit-results.dto";
import { StatsDto } from "./stats.dto";

@Exclude()
export class ElectionRegionResultsDto {
  @Expose({ name: 'code', groups: ['list', 'details'] })
  number: number;

  @Expose({ groups: ['list', 'details'] })
  name: string;

  @Expose({ groups: ['list', 'details'] })
  results: number[] = [];

  @Expose({ groups: ['details'] })
  admunits: Map<string, AdmUnitResultsDto> = new Map<string, AdmUnitResultsDto>();

  @Expose({ groups: ['list', 'details'] })
  validVotes?: number = null;

  @Expose({ groups: ['list', 'details'] })
  invalidVotes?: number = null;

  @Expose({ groups: ['list', 'details'] })
  voters?: number = null;

  @Expose({ name: 'isAbroad', groups: ['list'] })
  abroad: boolean = false;

  @Expose({ groups: ['list', 'details'] })
  stats: StatsDto = new StatsDto();

  public static fromEntity(entity: ElectionRegion, groups = ['list']): ElectionRegionResultsDto {
    const electionRegionDto = plainToClass<ElectionRegionResultsDto, Partial<ElectionRegion>>(ElectionRegionResultsDto, entity, {
      exposeDefaultValues: true,
      groups,
    });

    const picked = (({ sectionsCount }) => ({ sectionsCount }))(entity);
    electionRegionDto.stats = plainToClass<StatsDto, any>(StatsDto, picked, {
      groups,
    });

    return electionRegionDto;
  }
}
