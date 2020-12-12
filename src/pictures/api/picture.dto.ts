import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass } from 'class-transformer';
import { Picture } from '../entities/picture.entity';

@Exclude()
export class PictureDto {
  @ApiProperty()
  @Expose({ groups: ['read'] })
  id: string;

  @ApiProperty()
  @Expose({ groups: ['read'] })
  url: string;

  public static fromEntity(entity: Picture): PictureDto {
    return plainToClass<PictureDto, Partial<Picture>>(PictureDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    })
  }
}
