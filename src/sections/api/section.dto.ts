import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass } from 'class-transformer';
import { IsNotEmpty, IsNumberString, IsOptional, IsString, Length } from 'class-validator';
import { Section } from '../entities/section.entity';
import { IsSectionExists } from './section-exists.constraint';

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

  public static fromEntity(entity: Section): SectionDto {
    return plainToClass<SectionDto, Partial<Section>>(SectionDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    })
  }
}
