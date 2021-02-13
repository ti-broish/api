import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { UserDto } from 'src/users/api/user.dto';
import { PictureDto } from '../../pictures/api/picture.dto';
import { SectionDto } from '../../sections/api/section.dto';
import { Protocol, ProtocolStatus } from '../entities/protocol.entity';

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
  @Transform((ids: string[]) => Array.isArray(ids) ? ids.map(id => plainToClass(PictureDto, { id }, { groups: ['create'] })) : ids, { groups: ['create'] })
  @Type(() => PictureDto)
  @IsArray({ groups: ['create'] })
  @ArrayNotEmpty({ groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    each: true,
    groups: ['create'],
  })
  pictures: PictureDto[]

  @ApiProperty({ required: true })
  @Expose({ groups: ['read'] })
  @Type(() => UserDto)
  assignees: UserDto[]

  @Expose({ groups: ['read'] })
  status: ProtocolStatus;

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
