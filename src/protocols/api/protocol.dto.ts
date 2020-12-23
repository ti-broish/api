import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass, Transform, TransformPlainToClass, Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { PictureDto } from 'src/pictures/api/picture.dto';
import { SectionDto } from 'src/sections/api/section.dto';
import { Protocol } from '../entities/protocol.entity';

@Exclude()
export class ProtocolDto {
  @ApiProperty()
  @Expose({ groups: ['read'] })
  id: number;

  @ApiProperty({ required: true })
  @Expose({ groups: ['read', 'create'] })
  @Type(() => SectionDto)
  @Transform((id: string) => plainToClass(SectionDto, { id }, { groups: ['create'] }), { groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    groups: ['create'],
  })
  section: SectionDto;

  @ApiProperty({ required: true })
  @Expose({ groups: ['read', 'create'] })
  @Transform((ids: string[]) => ids.map(id => plainToClass(PictureDto, { id }, { groups: ['create'] })), { groups: ['create'] })
  @Type(() => PictureDto)
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    each: true,
    groups: ['create'],
  })
  pictures: PictureDto[]

  public toEntity(): Protocol {
    return plainToClass<Protocol, Partial<ProtocolDto>>(Protocol, this, {
      groups: ['create'],
    });
  }

  public static fromEntity(entity: Protocol): ProtocolDto {
    return plainToClass<ProtocolDto, Partial<Protocol>>(ProtocolDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    });
  }
}
