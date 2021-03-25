import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { UserDto } from 'src/users/api/user.dto';
import { PictureDto } from '../../pictures/api/picture.dto';
import { SectionDto } from '../../sections/api/section.dto';
import { Protocol, ProtocolStatus } from '../entities/protocol.entity';
import { ProtocolResultDto, ProtocolResultsDto } from './protocol-results.dto';

@Exclude()
export class ProtocolDto {
  @ApiProperty()
  @Expose({ groups: ['read'] })
  id: number;

  @ApiProperty({ required: true })
  @Expose({ groups: ['read', 'create', 'replace'] })
  @Type(() => SectionDto)
  @IsOptional({ groups: ['replace'] })
  @Transform((id: string) => plainToClass(SectionDto, { id }, { groups: ['create'] }), { groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    groups: ['create', 'replace'],
  })
  section: SectionDto;

  @ApiProperty({ required: true })
  @Expose({ groups: ['read', 'create'] })
  @Transform((ids: string[]) => Array.isArray(ids) ? ids.map(id => plainToClass(PictureDto, { id }, { groups: ['create'] })) : ids, { groups: ['create'] })
  @Type(() => PictureDto)
  @IsOptional({ groups: ['replace'] })
  @IsArray({ groups: ['create'] })
  @ArrayNotEmpty({ groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    each: true,
    groups: ['create'],
  })
  pictures: PictureDto[]

  @ApiProperty({ required: true })
  @Expose({ groups: [UserDto.AUTHOR_READ] })
  @Type(() => UserDto)
  assignees: UserDto[]

  @Expose({ groups: ['read'] })
  status: ProtocolStatus;

  @Expose({ groups: ['replace', 'read.results'] })
  @Type(() => ProtocolResultsDto)
  @IsNotEmpty({ groups: ['replace'] })
  @ValidateNested({
    groups: ['replace'],
  })
  results: ProtocolResultsDto;

  private author: UserDto;

  @Expose({ groups: ['protocol.validate'] })
  @Type(() => UserDto)
  getAuthor(): UserDto {
    return this.author;
  }

  public toEntity(): Protocol {
    return plainToClass<Protocol, Partial<ProtocolDto>>(Protocol, this, {
      groups: ['create', 'replace'],
    });
  }

  public static fromEntity(protocol: Protocol, additionalGroups: string[] = []): ProtocolDto {
    const protocolDto = plainToClass<ProtocolDto, Partial<Protocol>>(ProtocolDto, protocol, {
      excludeExtraneousValues: true,
      groups: ['read', ...additionalGroups],
    });

    if (additionalGroups.includes('protocol.validate')) {
      protocolDto.author = UserDto.fromEntity(protocol.getAuthor(), ['protocol.validate']);
    }

    return protocolDto;
  }
}
