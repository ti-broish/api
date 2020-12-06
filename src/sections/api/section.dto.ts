import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass } from 'class-transformer';
import { Section } from '../entities/section.entity';

@Exclude()
export class SectionDto {
  @ApiProperty()
  @Expose()
  public readonly id: string;

  @ApiProperty()
  @Expose()
  public readonly code: string;

  @ApiProperty()
  @Expose()
  public readonly place: string;

  public static fromEntity(entity: Section): SectionDto {
    return plainToClass<SectionDto, Partial<Section>>(SectionDto, entity, { excludeExtraneousValues: true })
  }
}
