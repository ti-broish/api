import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, plainToClass, Type } from 'class-transformer'
import { ElectionRegion } from '../entities'
import { MunicipalityDto } from './municipality.dto'

@Exclude()
export class ElectionRegionDto {
  @ApiProperty()
  @Expose()
  code: string

  @ApiProperty()
  @Expose()
  name: string

  @ApiProperty()
  @Expose()
  isAbroad: boolean

  @ApiProperty()
  @Expose()
  @Type(() => MunicipalityDto)
  municipalities: MunicipalityDto[]

  public static fromEntity(entity: ElectionRegion): ElectionRegionDto {
    return plainToClass<ElectionRegionDto, Partial<ElectionRegion>>(
      ElectionRegionDto,
      entity,
      { excludeExtraneousValues: true },
    )
  }
}
