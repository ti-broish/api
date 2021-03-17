import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass, Type } from 'class-transformer';
import { IsNotEmpty, IsNumberString, IsOptional, IsString, Length } from 'class-validator';
import { ElectionRegion } from '../entities';
import { Section } from '../entities/section.entity';
import { CityRegionDto } from './cityRegion.dto';
import { ElectionRegionDto } from './electionRegion.dto';
import { IsSectionExists } from './section-exists.constraint';
import { TownDto } from './town.dto';

const allowedGroups = ['read', 'get'];

@Exclude()
export class SectionDto {
  @ApiProperty()
  @Expose({ groups: ['read', 'create', 'replace'] })
  @IsSectionExists({ groups: ['create', 'replace'] })
  @Length(Section.SECTION_ID_LENGTH, Section.SECTION_ID_LENGTH, { groups: ['create', 'replace'] })
  @IsString({ groups: ['create', 'replace'] })
  @IsNumberString({ no_symbols: true }, { groups: ['create', 'replace'] })
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
  @Expose({ groups: ['get'] })
  electionRegion: ElectionRegionDto;

  @Type(() => TownDto)
  @Expose({ groups: ['get'] })
  town: TownDto;

  @Type(() => CityRegionDto)
  @Expose({ groups: ['get'] })
  cityRegion: CityRegionDto;

  public static fromEntity(entity: Section, additionalGroups: string[] = ['read']): SectionDto {
    return plainToClass<SectionDto, Partial<Section>>(SectionDto, entity, {
      excludeExtraneousValues: true,
      groups: additionalGroups.filter(value => allowedGroups.includes(value)),
    })
  }
}
