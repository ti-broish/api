import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Picture } from 'src/pictures/entities/picture.entity';
import { UserDto } from 'src/users/api/user.dto';
import { PictureDto } from '../../pictures/api/picture.dto';
import { SectionDto } from '../../sections/api/section.dto';
import { Protocol, ProtocolStatus } from '../entities/protocol.entity';
import { ProtocolResultDto, ProtocolResultsDto } from './protocol-results.dto';

export enum ProtocolStatusOverride {
  PROCESSED = 'processed',
}
@Exclude()
export class ProtocolDto {
  @ApiProperty()
  @Expose({ groups: ['read'] })
  id: number;

  @ApiProperty({ required: true })
  @Expose({ groups: ['read', 'create', 'replace'] })
  @Type(() => SectionDto)
  @IsOptional({ groups: ['replace'] })
  @Transform(({ value: id }) => plainToClass(SectionDto, { id }, { groups: ['create'] }), { groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    groups: ['create', 'replace'],
  })
  section: SectionDto;

  @ApiProperty({ required: true })
  @Expose({ groups: ['read', 'create', 'replace'] })
  @Transform(({ value: ids }) => Array.isArray(ids) ? ids.map(id => plainToClass(PictureDto, { id }, { groups: ['create'] })) : ids, { groups: ['create'] })
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
  status: ProtocolStatus | ProtocolStatusOverride;

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

  public toEntity(groups: string[] = ['create']): Protocol {
    const protocol = plainToClass<Protocol, Partial<ProtocolDto>>(Protocol, this, {
      groups: groups,
    });

    let sortPosition = 1;
    protocol.pictures = (protocol.pictures || []).map((picture: Picture): Picture => {
      picture.sortPosition = sortPosition;
      sortPosition++;

      return picture;
    }, []);

    if (protocol.results) {
      protocol.results = this.results.toResults();
      protocol.data = this.results.toProtocolData()
    }

    return protocol;
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
