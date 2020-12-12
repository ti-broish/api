import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass } from 'class-transformer';
import { Picture } from '../entities/picture.entity';

@Exclude()
export class PictureDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  url: string;

  @ApiProperty()
  @Expose()
  sortPosition: number;

  public static fromEntity(entity: Picture): PictureDto {
    return plainToClass<PictureDto, Partial<Picture>>(PictureDto, entity, { excludeExtraneousValues: true });
  }
}
