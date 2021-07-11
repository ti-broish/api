import { ApiProperty } from '@nestjs/swagger';
import {
  Exclude,
  Expose,
  plainToClass,
  Transform,
  Type,
} from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Picture } from 'src/pictures/entities/picture.entity';
import { UserDto } from 'src/users/api/user.dto';
import { PictureDto } from '../../pictures/api/picture.dto';
import { SectionDto } from '../../sections/api/section.dto';
import { ProtocolResult } from '../entities/protocol-result.entity';
import {
  Protocol,
  ProtocolData,
  ProtocolStatus,
} from '../entities/protocol.entity';
import { ProtocolResultDto } from './protocol-result.dto';

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
  @Transform(
    ({ value: id }) => plainToClass(SectionDto, { id }, { groups: ['create'] }),
    { groups: ['create'] },
  )
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    groups: ['create', 'replace'],
  })
  section: SectionDto;

  @ApiProperty({ required: true })
  @Expose({ groups: ['read', 'create', 'replace'] })
  @Transform(
    ({ value: ids }) =>
      Array.isArray(ids)
        ? ids.map((id) =>
            plainToClass(PictureDto, { id }, { groups: ['create'] }),
          )
        : ids,
    { groups: ['create'] },
  )
  @Type(() => PictureDto)
  @IsOptional({ groups: ['replace'] })
  @IsArray({ groups: ['create'] })
  @ArrayNotEmpty({ groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    each: true,
    groups: ['create'],
  })
  pictures: PictureDto[];

  @ApiProperty({ required: true })
  @Expose({ groups: ['author_read'] })
  @Type(() => UserDto)
  assignees: UserDto[];

  @Expose({ groups: ['read'] })
  status: ProtocolStatus | ProtocolStatusOverride;

  @Type(() => ProtocolResultDto)
  @IsNotEmpty({ groups: ['replace', 'read.results'] })
  @IsArray({ groups: ['replace', 'read.results'] })
  @ArrayNotEmpty({ groups: ['replace', 'read.results'] })
  @ValidateNested({
    each: true,
    groups: ['replace', 'read.results'],
  })
  @Expose({ groups: ['read', 'replace', 'read.results'] })
  results: ProtocolResultDto[] = [];

  @Expose({ groups: ['read', 'read.results', 'replace'] })
  @IsBoolean({ groups: ['replace'] })
  hasPaperBallots?: boolean;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(2, { groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  machinesCount?: number;

  @IsBoolean({ groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  isFinal: boolean;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  additionalVotersCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  votersVotedCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(50000, { groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  uncastBallots?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  invalidAndUncastBallots?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  nonMachineVotesCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(50000, { groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  votersCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  totalVotesCast?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  validVotesCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  invalidVotesCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  machineVotesCount?: number;

  private author: UserDto;

  @Expose({ groups: ['protocol.validate'] })
  @Type(() => UserDto)
  getAuthor(): UserDto {
    return this.author;
  }

  public toEntity(groups: string[] = ['create']): Protocol {
    const protocol = plainToClass<Protocol, Partial<ProtocolDto>>(
      Protocol,
      this,
      {
        groups: groups,
      },
    );

    let sortPosition = 1;
    protocol.pictures = (protocol.pictures || []).map(
      (picture: Picture): Picture => {
        picture.sortPosition = sortPosition;
        sortPosition++;

        return picture;
      },
      [],
    );

    if (protocol.results) {
      protocol.results = this.results.map(
        (resultDto: ProtocolResultDto): ProtocolResult => resultDto.toEntity(),
      );
      const PROTOCOL_METADATA_KEYS = Object.keys(new ProtocolData());
      protocol.setData(
        PROTOCOL_METADATA_KEYS.reduce(
          (data: ProtocolData, key: string): ProtocolData => {
            data[key] = this[key];
            return data;
          },
          {} as ProtocolData,
        ),
      );
    }

    return protocol;
  }

  public static fromEntity(
    protocol: Protocol,
    additionalGroups: string[] = [],
  ): ProtocolDto {
    const protocolDto = plainToClass<ProtocolDto, Partial<Protocol>>(
      ProtocolDto,
      protocol,
      {
        excludeExtraneousValues: true,
        groups: ['read', ...additionalGroups],
      },
    );

    if (additionalGroups.includes('protocol.validate')) {
      protocolDto.author = UserDto.fromEntity(protocol.getAuthor(), [
        'protocol.validate',
      ]);
    }

    if (additionalGroups.includes('read.results')) {
      const PROTOCOL_METADATA_KEYS = Object.getOwnPropertyNames(
        new ProtocolData(),
      );
      PROTOCOL_METADATA_KEYS.reduce(
        (dto: ProtocolDto, key: string): ProtocolData => {
          dto[key] = protocol.metadata?.[key];
          return dto;
        },
        protocolDto,
      );
    }

    return protocolDto;
  }
}
