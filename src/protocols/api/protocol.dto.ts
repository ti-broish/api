import { ApiProperty } from '@nestjs/swagger'
import {
  Exclude,
  Expose,
  plainToClass,
  Transform,
  Type,
} from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { Picture } from 'src/pictures/entities/picture.entity'
import { UserDto } from 'src/users/api/user.dto'
import { User } from 'src/users/entities'
import { PictureDto } from '../../pictures/api/picture.dto'
import { SectionDto } from '../../sections/api/section.dto'
import {
  ProtocolAction,
  ProtocolActionType,
} from '../entities/protocol-action.entity'
import { ProtocolResult } from '../entities/protocol-result.entity'
import {
  Protocol,
  ProtocolData,
  ProtocolRejectionReason,
  ProtocolStatus,
} from '../entities/protocol.entity'
import { ProtocolResultDto } from './protocol-result.dto'

export enum ProtocolStatusOverride {
  PROCESSED = 'processed',
}

const compareObjects = (a: any, b: any): boolean => {
  if (a === b) return true
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  )
    return false

  const keysA = Object.keys(a).sort()
  const keysB = Object.keys(b).sort()

  if (keysA.length !== keysB.length) return false

  for (let i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i]) return false
    if (!compareObjects(a[keysA[i]], b[keysB[i]])) return false
  }

  return true
}

@Exclude()
export class ProtocolDto {
  @ApiProperty()
  @Expose({ groups: ['read', 'protocol.protocolInResults'] })
  id: number

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
  @IsOptional({ groups: ['create'] })
  @Transform(
    ({ value: id }): any =>
      typeof id === 'string'
        ? plainToClass(SectionDto, { id }, { groups: ['create', 'replace'] })
        : id,
    { groups: ['create', 'replace'] },
  )
  @IsNotEmpty({ groups: ['replace'] })
  @ValidateNested({
    groups: ['create', 'replace'],
  })
  section: SectionDto

  @ApiProperty({ required: true })
  @Expose({
    groups: ['read', 'create', 'replace', 'protocol.protocolInResults'],
  })
  @Transform(
    ({ value: ids }) =>
      Array.isArray(ids)
        ? ids.map(
            (id): PictureDto =>
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
  pictures: PictureDto[]

  @ApiProperty({ required: true })
  @Expose({ groups: ['author_read'] })
  @Type(() => UserDto)
  assignees: UserDto[]

  @Expose({ groups: ['read', 'protocol.protocolInResults'] })
  status: ProtocolStatus | ProtocolStatusOverride

  @Expose({ name: 'rejectionReason', groups: ['read', 'compare'] })
  reason: ProtocolRejectionReason

  @Type(() => ProtocolResultDto)
  @IsNotEmpty({ groups: ['read.results'] })
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
  results: ProtocolResultDto[] = []

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
  hasPaperBallots?: boolean

  @IsOptional({ groups: ['read', 'replace', 'compare'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(2, { groups: ['replace'] })
  @Expose({
    groups: ['read', 'read.results', 'replace', 'protocol.protocolInResults'],
  })
  machinesCount?: number

  @IsBoolean({ groups: ['replace'] })
  @Expose({ groups: ['read', 'read.results', 'replace', 'compare'] })
  isFinal: boolean

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
  additionalVotersCount?: number

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
  votersVotedCount?: number

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
  uncastBallots?: number

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
  invalidAndUncastBallots?: number

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
  nonMachineCastBallotsCount?: number

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
  machineCastBallotsCount?: number

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
  castBallotsCount?: number

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
  nonMachineVotesCount?: number

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
  votersCount?: number

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
  totalVotesCast?: number

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
  validVotesCount?: number

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
  invalidVotesCount?: number

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
  machineVotesCount?: number

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
  partyNonMachineVotesCount?: number

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
  partyMachineVotesCount?: number

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
  partyValidVotesCount?: number

  @Expose({
    groups: ['protocol.validate'],
  })
  origin: string

  @Expose({
    groups: ['created'],
  })
  secret: string

  @Expose({ groups: ['read'] })
  createdAt: Date

  private author: UserDto

  @Expose({ groups: ['protocol.validate'] })
  @Type(() => UserDto)
  getAuthor(): UserDto {
    return this.author
  }

  public toEntity(groups: string[] = ['create']): Protocol {
    const protocol = plainToClass<Protocol, Partial<ProtocolDto>>(
      Protocol,
      this,
      {
        groups: groups,
      },
    )

    let sortPosition = 1
    protocol.pictures = (protocol.pictures || []).map(
      (picture: Picture): Picture => {
        picture.sortPosition = sortPosition
        sortPosition++

        return picture
      },
      [],
    )

    if (protocol.results) {
      protocol.results = this.results.map(
        (resultDto: ProtocolResultDto): ProtocolResult => resultDto.toEntity(),
      )
      const PROTOCOL_METADATA_KEYS = Object.keys(new ProtocolData())
      protocol.setData(
        PROTOCOL_METADATA_KEYS.reduce(
          (data: ProtocolData, key: string): ProtocolData => {
            data[key] = this[key]
            return data
          },
          {} as ProtocolData,
        ),
      )
    }

    return protocol
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
    )

    let author: User | null
    if (
      groups.includes('protocol.validate') &&
      (author = protocol.getAuthor())
    ) {
      protocolDto.author = UserDto.fromEntity(author, ['protocol.validate'])
    }

    if (
      groups.includes('read.results') ||
      groups.includes('protocol.protocolInResults')
    ) {
      const PROTOCOL_METADATA_KEYS = Object.getOwnPropertyNames(
        new ProtocolData(),
      )
      PROTOCOL_METADATA_KEYS.reduce(
        (dto: ProtocolDto, key: string): ProtocolDto => {
          dto[key] = protocol.metadata?.[key]
          return dto
        },
        protocolDto,
      )
    }

    if (groups.includes('read')) {
      protocolDto.createdAt = (protocol.actions || []).find(
        (action: ProtocolAction): boolean =>
          action.action === ProtocolActionType.SEND,
      )?.timestamp
    }

    return protocolDto
  }

  static compare(protocolA: Protocol, protocolB: Protocol): boolean {
    const dtoA = ProtocolDto.fromEntity(protocolA, ['compare'])
    const dtoB = ProtocolDto.fromEntity(protocolB, ['compare'])

    return compareObjects(dtoA, dtoB)
  }
}

@Exclude()
export class ProtocolRejectionDto {
  @Expose()
  @IsNotEmpty()
  @IsIn(Object.values(ProtocolRejectionReason), {
    always: true,
  })
  reason: ProtocolRejectionReason
}

@Exclude()
export class ProtocolContactDto {
  @ApiProperty()
  @Expose({ groups: ['setContact'] })
  @IsEmail({}, { groups: ['setContact'], message: 'USER_EMAIL_INVALID' })
  @Transform(
    ({ value: email }: { value: string }) =>
      email ? email.toLowerCase() : email,
    {
      groups: ['setContact'],
    },
  )
  @IsNotEmpty({ groups: ['setContact'], message: 'USER_EMAIL_NOT_EMPTY' })
  email: string

  @Expose({
    groups: ['setContact'],
  })
  secret: string
}
