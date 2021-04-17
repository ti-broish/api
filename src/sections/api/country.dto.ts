import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass } from 'class-transformer';
import { Country } from '../entities/country.entity';

@Exclude()
export class CountryDto extends Country {
  @ApiProperty()
  @Expose()
  code: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  isAbroad: boolean;

  public static fromEntity(entity: Country): CountryDto {
    return plainToClass<CountryDto, Partial<Country>>(CountryDto, entity, {
      excludeExtraneousValues: true,
    });
  }
}
