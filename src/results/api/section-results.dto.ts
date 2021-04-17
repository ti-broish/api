import { PickType } from '@nestjs/swagger';
import {
  Exclude,
  Expose,
  plainToClass,
  TransformOptions,
} from 'class-transformer';
import { Section } from 'src/sections/entities';
import { SectionDetailsResultDto } from './section-details-result.dto';
import { StatsDto } from './stats.dto';

@Exclude()
export class SectionResultsDto {
  @Expose({ groups: ['list', 'details'] })
  results: number[];

  @Expose({ groups: ['list', 'details'] })
  stats: Omit<StatsDto, 'sectionsCount' | 'sectionsWithResults'>;

  public static fromEntity(
    section: Section,
    options: TransformOptions,
  ): SectionResultsDto {
    const sectionDto = plainToClass<SectionResultsDto, Partial<Section>>(
      SectionResultsDto,
      section,
      options,
    );

    return sectionDto;
  }
}
