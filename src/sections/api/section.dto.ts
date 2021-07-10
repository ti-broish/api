import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass, Type } from 'class-transformer';
import { IsNumberString, IsString, Length } from 'class-validator';
import { StreamDto } from 'src/streams/api/stream.dto';
import { ViolationDto } from 'src/violations/api/violation.dto';
import { Section } from '../entities/section.entity';
import { CityRegionDto } from './cityRegion.dto';
import { ElectionRegionDto } from './electionRegion.dto';
import { IsSectionExists } from './section-exists.constraint';
import { TownDto } from './town.dto';

const allowedGroups = ['read', 'get'];

@Exclude()
export class SectionDto {
  @ApiProperty()
  @Expose({
    groups: [
      'read',
      'create',
      StreamDto.CREATE,
      StreamDto.WATCH,
      ViolationDto.FEED,
      'replace',
    ],
  })
  @IsSectionExists({ groups: ['create', StreamDto.CREATE, 'replace'] })
  @Length(Section.SECTION_ID_LENGTH, Section.SECTION_ID_LENGTH, {
    groups: ['create', StreamDto.CREATE, 'replace'],
  })
  @IsString({ groups: ['create', StreamDto.CREATE, 'replace'] })
  @IsNumberString(
    { no_symbols: true },
    { groups: ['create', StreamDto.CREATE, 'replace'] },
  )
  public id: string;

  @ApiProperty()
  @Expose({ groups: ['read', ViolationDto.FEED] })
  public code: string;

  @ApiProperty()
  @Expose({ groups: ['read', ViolationDto.FEED] })
  public place: string;

  @Expose({ groups: ['get', ViolationDto.FEED] })
  votersCount: number;

  @Expose({ groups: ['get', ViolationDto.FEED] })
  isMachine: boolean;

  @Expose({ groups: ['get', ViolationDto.FEED] })
  isMobile: boolean;

  @Type(() => ElectionRegionDto)
  @Expose({ groups: ['get', 'read', StreamDto.READ, ViolationDto.FEED] })
  electionRegion: ElectionRegionDto;

  @Type(() => TownDto)
  @Expose({ groups: ['get', 'read', StreamDto.READ] })
  town: TownDto;

  @Type(() => CityRegionDto)
  @Expose({ groups: ['get', 'read', StreamDto.READ, ViolationDto.FEED] })
  cityRegion: CityRegionDto;

  public static fromEntity(
    entity: Section,
    additionalGroups: string[] = ['read'],
  ): SectionDto {
    return plainToClass<SectionDto, Partial<Section>>(SectionDto, entity, {
      excludeExtraneousValues: true,
      groups: additionalGroups.filter((value) => allowedGroups.includes(value)),
    });
  }
}
