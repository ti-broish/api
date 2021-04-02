import { Exclude, Expose, plainToClass, TransformOptions } from "class-transformer";
import { Town } from "src/sections/entities";

@Exclude()
export class TownResultsDto {
  code: number;

  @Expose({ groups: ['list'] })
  name: string;

  public static fromEntity(town: Town, options: TransformOptions): TownResultsDto {
    const townDto = plainToClass<TownResultsDto, Partial<Town>>(TownResultsDto, town, options);

    return townDto;
  }
}
