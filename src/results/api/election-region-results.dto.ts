import { Exclude, Expose, plainToClass } from "class-transformer";
import { ElectionRegion } from "src/sections/entities";
import { AdmUnitResultsDto } from "./administrative-unit-results.dto";

@Exclude()
export class ElectionRegionResultsDto {
  @Expose({ name: 'code' })
  number: number;

  @Expose()
  name: string;

  @Expose()
  results: number[] = [];

  @Expose()
  admunits: Map<string, AdmUnitResultsDto> = new Map<string, AdmUnitResultsDto>();

  @Expose()
  validVotes?: number = null;

  @Expose()
  invalidVotes?: number = null;

  @Expose()
  voters?: number = null;

  @Expose({ name: 'isAbroad' })
  abroad: boolean = false;

  public static fromEntity(entity: ElectionRegion): ElectionRegionResultsDto {
    return plainToClass<ElectionRegionResultsDto, Partial<ElectionRegion>>(ElectionRegionResultsDto, entity, {
      exposeDefaultValues: true,
    });
  }
}
