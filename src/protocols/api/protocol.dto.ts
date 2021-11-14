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
  IsIn,
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
  ProtocolRejectionReason,
  ProtocolStatus,
} from '../entities/protocol.entity';
import { ProtocolResultDto } from './protocol-result.dto';

export enum ProtocolStatusOverride {
  PROCESSED = 'processed',
}

@Exclude()
export class ProtocolDto {
  @ApiProperty()
  @Expose({ groups: ['read', 'protocol.protocolInResults'] })
  id: number;

  @ApiProperty({ required: true })
  @Expose({
    groups: [
      'read',
      'create',
      'replace',
      'protocol.protocolInResults',
      'compare',
    ],
  })
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
  @Expose({
    groups: ['read', 'create', 'replace', 'protocol.protocolInResults'],
  })
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

  @Expose({ groups: ['read', 'protocol.protocolInResults'] })
  status: ProtocolStatus | ProtocolStatusOverride;

  @Expose({ name: 'rejectionReason', groups: ['read', 'compare'] })
  reason: ProtocolRejectionReason;

  @Type(() => ProtocolResultDto)
  @IsNotEmpty({ groups: ['replace', 'read.results'] })
  @IsArray({ groups: ['replace', 'read.results'] })
  @ArrayNotEmpty({ groups: ['replace', 'read.results'] })
  @ValidateNested({
    each: true,
    groups: ['replace', 'read.results'],
  })
  @Expose({
    groups: [
      'read',
      'replace',
      'read.results',
      'protocol.protocolInResults',
      'compare',
    ],
  })
  results: ProtocolResultDto[] = [];

  @Expose({
    groups: [
      'read',
      'read.results',
      'replace',
      'protocol.protocolInResults',
      'compare',
    ],
  })
  @IsBoolean({ groups: ['replace'] })
  hasPaperBallots?: boolean;

  @IsOptional({ groups: ['read', 'replace', 'compare'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(2, { groups: ['replace'] })
  @Expose({
    groups: ['read', 'read.results', 'replace', 'protocol.protocolInResults'],
  })
  machinesCount?: number;

  @IsBoolean({ groups: ['replace', 'compare'] })
  @Expose({ groups: ['read', 'read.results', 'replace'] })
  isFinal: boolean;

  @IsOptional({ groups: ['read', 'replace', 'compare'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({
    groups: ['read', 'read.results', 'replace', 'protocol.protocolInResults'],
  })
  additionalVotersCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({
    groups: [
      'read',
      'read.results',
      'replace',
      'protocol.protocolInResults',
      'compare',
    ],
  })
  votersVotedCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(50000, { groups: ['replace'] })
  @Expose({
    groups: [
      'read',
      'read.results',
      'replace',
      'protocol.protocolInResults',
      'compare',
    ],
  })
  uncastBallots?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({
    groups: [
      'read',
      'read.results',
      'replace',
      'protocol.protocolInResults',
      'compare',
    ],
  })
  invalidAndUncastBallots?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({
    groups: [
      'read',
      'read.results',
      'replace',
      'protocol.protocolInResults',
      'compare',
    ],
  })
  nonMachineVotesCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(50000, { groups: ['replace'] })
  @Expose({
    groups: [
      'read',
      'read.results',
      'replace',
      'protocol.protocolInResults',
      'compare',
    ],
  })
  votersCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({
    groups: [
      'read',
      'read.results',
      'replace',
      'protocol.protocolInResults',
      'compare',
    ],
  })
  totalVotesCast?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({
    groups: [
      'read',
      'read.results',
      'replace',
      'protocol.protocolInResults',
      'compare',
    ],
  })
  validVotesCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({
    groups: [
      'read',
      'read.results',
      'replace',
      'protocol.protocolInResults',
      'compare',
    ],
  })
  invalidVotesCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @Expose({
    groups: [
      'read',
      'read.results',
      'replace',
      'protocol.protocolInResults',
      'compare',
    ],
  })
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
    groups: string[] = ['read'],
  ): ProtocolDto {
    const protocolDto = plainToClass<ProtocolDto, Partial<Protocol>>(
      ProtocolDto,
      protocol,
      {
        excludeExtraneousValues: true,
        groups,
      },
    );

    if (groups.includes('protocol.validate')) {
      protocolDto.author = UserDto.fromEntity(protocol.getAuthor(), [
        'protocol.validate',
      ]);
    }

    if (
      groups.includes('read.results') ||
      groups.includes('protocol.protocolInResults')
    ) {
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

  static compare(protocolA: Protocol, protocolB: Protocol): boolean {
    const dtoA = ProtocolDto.fromEntity(protocolA, ['compare']);
    const dtoB = ProtocolDto.fromEntity(protocolB, ['compare']);

    return JSON.stringify(dtoA) === JSON.stringify(dtoB);
  }
}

@Exclude()
export class ProtocolRejectionDto {
  @Expose()
  @IsNotEmpty()
  @IsIn(Object.values(ProtocolRejectionReason), {
    always: true,
  })
  reason: ProtocolRejectionReason;
}
