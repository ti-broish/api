import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Picture } from '../entities/picture.entity';
import { PathInterface } from '../path.interface';
import { IsPictureExists } from './picture-exists.constraint';

@Exclude()
export class PictureDto implements PathInterface {
  @ApiProperty()
  @Expose({ groups: ['read', 'create', 'replace'] })
  @IsPictureExists({ groups: ['create', 'replace'] })
  @IsString({ groups: ['create', 'replace'] })
  @IsNotEmpty({ groups: ['create', 'replace'] })
  id: string;

  @ApiProperty()
  @Expose({ groups: ['read'] })
  url: string;

  @Expose({ groups: ['read'] })
  path: string;

  @Expose({ groups: ['read', 'replace'] })
  rotation: number;

  public static fromEntity(entity: Picture): PictureDto {
    return plainToClass<PictureDto, Partial<Picture>>(PictureDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    });
  }

  getPath(): string {
    return this.path;
  }
}
