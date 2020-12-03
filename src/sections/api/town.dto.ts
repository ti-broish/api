import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass, Type } from 'class-transformer';
import { CityRegion, Town } from '../entities';
import { CityRegionDto } from './cityRegion.dto';
import { CountryDto } from './country.dto';
import { MunicipalityDto } from './municipality.dto';

@Exclude()
export class TownDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  @Type(() => CityRegionDto)
  cityRegions: CityRegionDto[];

  public static fromEntity(entity: Town): TownDto {
    return plainToClass<TownDto, Partial<Town>>(TownDto, entity, { excludeExtraneousValues: true })
  }
}
