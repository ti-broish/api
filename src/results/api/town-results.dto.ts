import {
  Exclude,
  Expose,
  plainToClass,
  Transform,
  TransformOptions,
} from 'class-transformer';
import { Section, Town } from 'src/sections/entities';
import { SectionResultsDto } from './section-results.dto';

@Exclude()
export class TownResultsDto {
  code: number;

  @Expose({ groups: ['list'] })
  name: string;

  @Expose({ groups: ['details'] })
  @Transform(
    ({
      value: sections = [],
      options,
    }: {
      value: Section[];
      options: TransformOptions;
    }): Record<string, TownResultsDto> => {
      return sections.reduce((acc: any, section: Section): Record<
        string,
        SectionResultsDto
      > => {
        acc[section.code] = SectionResultsDto.fromEntity(section, options);
        return acc;
      }, {});
    },
  )
  sections: Record<string, SectionResultsDto>;

  public static fromEntity(
    town: Town,
    options: TransformOptions,
  ): TownResultsDto {
    const townDto = plainToClass<TownResultsDto, Partial<Town>>(
      TownResultsDto,
      town,
      options,
    );

    return townDto;
  }
}
