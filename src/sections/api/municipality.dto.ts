import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass } from 'class-transformer';
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

  public static fromEntity(entity: Municipality): MunicipalityDto {
    return plainToClass<MunicipalityDto, Partial<Municipality>>(MunicipalityDto, entity, { excludeExtraneousValues: true })
  }
}
