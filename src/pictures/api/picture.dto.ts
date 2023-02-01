import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, plainToClass } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'
import { Picture } from '../entities/picture.entity'
import { PathInterface } from '../path.interface'
import { IsPictureExists } from './picture-exists.constraint'

@Exclude()
export class PictureDto implements PathInterface {
  @ApiProperty()
  @Expose({
    groups: ['read', 'create', 'replace', 'protocol.protocolInResults'],
  })
  @IsPictureExists({ groups: ['create', 'replace'] })
  @IsString({ groups: ['create', 'replace'] })
  @IsNotEmpty({ groups: ['create', 'replace'] })
  id: string

  @ApiProperty()
  @Expose({ groups: ['read', 'protocol.protocolInResults'] })
  url: string

  @Expose({ groups: ['read', 'protocol.protocolInResults'] })
  path: string

  @Expose({ groups: ['read', 'replace', 'protocol.protocolInResults'] })
  rotation: number

  public static fromEntity(entity: Picture): PictureDto {
    return plainToClass<PictureDto, Partial<Picture>>(PictureDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    })
  }

  getPath(): string {
    return this.path
  }
}
