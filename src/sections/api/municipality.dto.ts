import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass, Type } from 'class-transformer';
import { Municipality } from '../entities';
import { ElectionRegionDto } from './electionRegion.dto';

@Exclude()
export class MunicipalityDto {
  @ApiProperty()
  @Expose()
  code: string;

  @ApiProperty()
  @Expose()
  name: string;

  @Expose({ groups: ['violations.feed'] })
  @Type(() => ElectionRegionDto)
  electionRegions?: ElectionRegionDto[];

  public static fromEntity(entity: Municipality): MunicipalityDto {
    return plainToClass<MunicipalityDto, Partial<Municipality>>(
      MunicipalityDto,
      entity,
      { excludeExtraneousValues: true },
    );
  }
}
