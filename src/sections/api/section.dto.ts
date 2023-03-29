import { ApiProperty } from '@nestjs/swagger'
import {
  Exclude,
  Expose,
  plainToClass,
  Transform,
  Type,
} from 'class-transformer'
import { IsNumberString, IsString, Length } from 'class-validator'
import { StreamDto } from 'src/streams/api/stream.dto'
import { ViolationDto } from 'src/violations/api/violation.dto'
import { Section } from '../entities/section.entity'
import { CityRegionDto } from './cityRegion.dto'
import { ElectionRegionDto } from './electionRegion.dto'
import { IsSectionExists } from './section-exists.constraint'
import { TownDto } from './town.dto'

const allowedGroups = ['read', 'get', 'partialMatch']

@Exclude()
export class SectionDto {
  @ApiProperty()
  @Expose({
    groups: [
      'read',
      'create',
      'create.section',
      StreamDto.CREATE,
      StreamDto.WATCH,
      ViolationDto.FEED,
      'replace',
      'protocol.protocolInResults',
      'compare',
    ],
  })
  @IsSectionExists({ groups: ['create', StreamDto.CREATE, 'replace'] })
  @Length(Section.SECTION_ID_LENGTH, Section.SECTION_ID_LENGTH, {
    groups: ['create', 'create.section', StreamDto.CREATE, 'replace'],
  })
  @IsString({
    groups: ['create', 'create.section', StreamDto.CREATE, 'replace'],
  })
  @IsNumberString(
    { no_symbols: true },
    { groups: ['create', 'create.section', StreamDto.CREATE, 'replace'] },
  )
  public id: string

  @ApiProperty()
  @Expose({
    groups: [
      'read',
      ViolationDto.FEED,
      StreamDto.FEED,
      'protocol.protocolInResults',
    ],
  })
  public code: string

  @ApiProperty()
  @Expose({
    groups: [
      'read',
      ViolationDto.FEED,
      StreamDto.FEED,
      'protocol.protocolInResults',
    ],
  })
  public place: string

  @ApiProperty()
  @Expose({
    groups: [
      'read',
      ViolationDto.FEED,
      StreamDto.FEED,
      'protocol.protocolInResults',
    ],
  })
  public riskLevel: string

  @ApiProperty()
  @Expose({
    groups: [
      'read',
      ViolationDto.FEED,
      StreamDto.FEED,
      'protocol.protocolInResults',
    ],
  })
  public population: string

  @Expose({
    groups: [
      'get',
      ViolationDto.FEED,
      StreamDto.FEED,
      'protocol.protocolInResults',
    ],
  })
  votersCount: number

  @Expose({
    groups: [
      'get',
      ViolationDto.FEED,
      StreamDto.FEED,
      'protocol.protocolInResults',
    ],
  })
  isMachine: boolean

  @Expose({
    groups: [
      'get',
      ViolationDto.FEED,
      StreamDto.FEED,
      'protocol.protocolInResults',
    ],
  })
  isMobile: boolean

  @Type(() => ElectionRegionDto)
  @Expose({
    groups: [
      'get',
      'read',
      'partialMatch',
      StreamDto.READ,
      ViolationDto.FEED,
      StreamDto.FEED,
      'protocol.protocolInResults',
    ],
  })
  electionRegion: ElectionRegionDto

  @Type(() => TownDto)
  @Expose({
    groups: [
      'create.section',
      'get',
      'read',
      'partialMatch',
      StreamDto.READ,
      StreamDto.FEED,
      'protocol.protocolInResults',
    ],
  })
  @Transform(
    ({ value: id }) =>
      plainToClass(TownDto, { id }, { groups: ['create.section'] }),
    { groups: ['create.section'] },
  )
  town: TownDto

  @Type(() => CityRegionDto)
  @Expose({
    groups: [
      'get',
      'read',
      'partialMatch',
      StreamDto.READ,
      ViolationDto.FEED,
      'protocol.protocolInResults',
    ],
  })
  cityRegion: CityRegionDto

  public static fromEntity(
    entity: Section,
    additionalGroups: string[] = ['read'],
  ): SectionDto {
    return plainToClass<SectionDto, Partial<Section>>(SectionDto, entity, {
      excludeExtraneousValues: true,
      groups: additionalGroups.filter((value) => allowedGroups.includes(value)),
    })
  }
}
