import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { StreamDto } from 'src/streams/api/stream.dto';
import { Town } from '../entities';
import { CityRegionDto } from './cityRegion.dto';
import { CountryDto } from './country.dto';
import { MunicipalityDto } from './municipality.dto';
import { IsTownExists } from './town-exists.constraint';

@Exclude()
export class TownDto {
  @ApiProperty()
  @Expose({ name: 'code', groups: ['read', 'create', 'violations.feed'] })
  @IsTownExists({ groups: ['create'] })
  @IsNumber({}, { groups: ['create'] })
  @Min(1, { groups: ['create'] })
  @IsInt({ groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  id: number;

  @ApiProperty()
  @Expose({ groups: ['read', 'violations.feed'] })
  name: string;

  @ApiProperty()
  @Expose({ groups: ['read', 'violations.feed'] })
  @Type(() => CityRegionDto)
  cityRegions: CityRegionDto[];

  @ApiProperty()
  @Expose({ groups: ['get', 'read', StreamDto.READ, 'violations.feed'] })
  @Type(() => CountryDto)
  country: CountryDto;

  @ApiProperty()
  @Expose({ groups: ['get', 'read', StreamDto.READ, 'violations.feed'] })
  @Type(() => MunicipalityDto)
  municipality: MunicipalityDto;

  public static fromEntity(entity: Town): TownDto {
    return plainToClass<TownDto, Partial<Town>>(TownDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    });
  }
}
