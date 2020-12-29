import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Town } from '../entities';
import { CityRegionDto } from './cityRegion.dto';
import { IsTownExists } from './town-exists.constraint';

@Exclude()
export class TownDto {
  @ApiProperty()
  @Expose({ groups: ['read', 'create'] })
  @IsTownExists({ groups: ['create'] })
  @IsNumber({}, { groups: ['create'] })
  @Min(1, { groups: ['create'] })
  @IsInt({ groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  id: number;

  @ApiProperty()
  @Expose({ groups: ['read'] })
  name: string;

  @ApiProperty()
  @Expose({ groups: ['read'] })
  @Type(() => CityRegionDto)
  cityRegions: CityRegionDto[];

  public static fromEntity(entity: Town): TownDto {
    return plainToClass<TownDto, Partial<Town>>(TownDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    })
  }
}
