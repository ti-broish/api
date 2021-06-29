import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass, Type } from 'class-transformer';
import { IsNumberString, IsString, Length } from 'class-validator';
import { StreamDto } from 'src/streams/api/stream.dto';
import { Section } from '../entities/section.entity';
import { CityRegionDto } from './cityRegion.dto';
import { ElectionRegionDto } from './electionRegion.dto';
import { IsSectionExists } from './section-exists.constraint';
import { TownDto } from './town.dto';

const allowedGroups = ['read', 'get'];

@Exclude()
export class SectionDto {
  @ApiProperty()
  @Expose({ groups: ['read', 'create', StreamDto.CREATE, 'replace'] })
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
  @Expose({ groups: ['read'] })
  public code: string;

  @ApiProperty()
  @Expose({ groups: ['read'] })
  public place: string;

  @Expose({ groups: ['get'] })
  votersCount: number;

  @Expose({ groups: ['get'] })
  isMachine: boolean;

  @Expose({ groups: ['get'] })
  isMobile: boolean;

  @Type(() => ElectionRegionDto)
  @Expose({ groups: ['get', 'read', StreamDto.READ] })
  electionRegion: ElectionRegionDto;

  @Type(() => TownDto)
  @Expose({ groups: ['get', 'read', StreamDto.READ] })
  town: TownDto;

  @Type(() => CityRegionDto)
  @Expose({ groups: ['get', 'read', StreamDto.READ] })
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
