import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, plainToClass, Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator'
import { StreamDto } from 'src/streams/api/stream.dto'
import { Town } from '../entities'
import { CityRegionDto } from './cityRegion.dto'
import { CountryDto } from './country.dto'
import { MunicipalityDto } from './municipality.dto'
import { IsTownExists } from './town-exists.constraint'

@Exclude()
export class TownDto {
  @ApiProperty()
  @Expose({
    name: 'code',
    groups: [
      'read',
      'create',
      'create.section',
      'violations.feed',
      'protocol.protocolInResults',
    ],
  })
  @IsTownExists({ groups: ['create', 'create.section'] })
  @IsNumber({}, { groups: ['create', 'create.section'] })
  @Min(1, { groups: ['create', 'create.section'] })
  @IsInt({ groups: ['create', 'create.section'] })
  @IsNotEmpty({ groups: ['create', 'create.section'] })
  id: number

  @ApiProperty()
  @Expose({
    groups: [
      'read',
      'violations.feed',
      'stream.feed',
      'protocol.protocolInResults',
    ],
  })
  name: string

  @ApiProperty()
  @Expose({
    groups: [
      'read',
      'violations.feed',
      'stream.feed',
      'protocol.protocolInResults',
    ],
  })
  @Type(() => CityRegionDto)
  cityRegions: CityRegionDto[]

  @ApiProperty()
  @Expose({
    groups: [
      'get',
      'read',
      'partialMatch',
      StreamDto.READ,
      'violations.feed',
      'stream.feed',
      'protocol.protocolInResults',
    ],
  })
  @Type(() => CountryDto)
  country: CountryDto

  @ApiProperty()
  @Expose({
    groups: [
      'get',
      'read',
      'partialMatch',
      StreamDto.READ,
      'violations.feed',
      'stream.feed',
      'protocol.protocolInResults',
    ],
  })
  @Type(() => MunicipalityDto)
  municipality: MunicipalityDto

  public static fromEntity(entity: Town): TownDto {
    return plainToClass<TownDto, Partial<Town>>(TownDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    })
  }
}
