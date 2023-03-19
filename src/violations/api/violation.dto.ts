import {
  Exclude,
  Expose,
  plainToClass,
  plainToInstance,
  Transform,
  Type,
} from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { SectionDto } from '../../sections/api/section.dto'
import { PictureDto } from '../../pictures/api/picture.dto'
import { Violation, ViolationStatus } from '../entities/violation.entity'
import { TownDto } from '../../sections/api/town.dto'
import { UserDto } from 'src/users/api/user.dto'
import { ViolationUpdateDto } from './violation-update.dto'
import { Picture } from 'src/pictures/entities/picture.entity'
import { Protocol } from '../../protocols/entities/protocol.entity'
import { ProtocolDto } from '../../protocols/api/protocol.dto'
import {
  ViolationContact,
  ViolationUpdateType,
} from '../entities/violation-update.entity'
import { User } from 'src/users/entities'

@Exclude()
export class ViolationDto {
  public static READ = 'violation.read'
  public static FEED = 'violations.feed'

  @Expose({ groups: ['read', ViolationDto.FEED] })
  id: string

  @Expose({ groups: ['read', 'create', ViolationDto.FEED] })
  @Type(() => SectionDto)
  @ValidateIf((violationDto: ViolationDto) => violationDto.town !== undefined)
  @Transform(
    ({ value: id }) =>
      id ? plainToClass(SectionDto, { id }, { groups: ['create'] }) : undefined,
    { groups: ['create'] },
  )
  @ValidateNested({
    groups: ['create'],
  })
  section?: SectionDto

  @Expose({ groups: ['read', 'create', ViolationDto.FEED] })
  @Type(() => TownDto)
  @Transform(
    ({ value: id }) =>
      plainToClass(TownDto, { code: id }, { groups: ['create'] }),
    { groups: ['create'] },
  )
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    groups: ['create'],
  })
  town: TownDto

  @Expose({ groups: ['read', 'create'] })
  @Type(() => PictureDto)
  @Transform(
    ({ value: ids }: { value: string[] }) =>
      Array.isArray(ids)
        ? ids.map((id) =>
            plainToClass(PictureDto, { id }, { groups: ['create'] }),
          )
        : ids,
    { groups: ['create'] },
  )
  @IsOptional({ groups: ['create'] })
  @IsArray({ groups: ['create'] })
  @ValidateNested({
    each: true,
    groups: ['create'],
  })
  pictures: PictureDto[]

  @Expose({ groups: ['read', 'create'] })
  @MinLength(20, { groups: ['create'] })
  @MaxLength(2000, { groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  description: string

  @Expose({ groups: ['read', ViolationDto.FEED] })
  status: ViolationStatus

  @Expose({ groups: ['read', 'isPublishedUpdate'] })
  @IsBoolean({ groups: ['isPublishedUpdate'] })
  isPublished: boolean

  @Expose({ groups: ['author_read'] })
  @Type(() => UserDto)
  assignees: UserDto[]

  @Expose({ groups: ['violation.process'] })
  @Type(() => ViolationUpdateDto)
  updates: ViolationUpdateDto[]

  private author: UserDto | ViolationContact

  @Expose({ groups: ['author_read'] })
  @Type(() => UserDto)
  getAuthor(): UserDto | ViolationContact {
    return this.author
  }

  @Expose({ groups: ['read', 'isPublishedUpdate', ViolationDto.FEED] })
  @MinLength(20, { groups: ['isPublishedUpdate'] })
  @MaxLength(2000, { groups: ['isPublishedUpdate'] })
  publishedText: string

  @Expose({
    groups: ['created'],
  })
  secret: string

  @Expose({ groups: ['create', 'contact'] })
  @IsNotEmpty({ groups: ['create'] })
  @IsString({ groups: ['create'] })
  @MaxLength(200, { groups: ['create'] })
  name: string

  @Expose({ groups: ['create', 'contact'] })
  @IsNotEmpty({ groups: ['create'] })
  @IsString({ groups: ['create'] })
  @MaxLength(200, { groups: ['create'] })
  @IsEmail({}, { groups: ['create'] })
  email: string

  @Expose({ groups: ['create', 'contact'] })
  @IsNotEmpty({ groups: ['create'] })
  @IsString({ groups: ['create'] })
  @MaxLength(200, { groups: ['create'] })
  @IsPhoneNumber(null, {
    groups: ['create'],
    message: 'USER_PHONE_INVALID',
  })
  phone: string

  @Expose({ groups: ['read', 'isPublishedUpdate', ViolationDto.FEED] })
  createdAt: Date

  public toEntity(): Violation {
    const violation = plainToClass<Violation, Partial<ViolationDto>>(
      Violation,
      this,
      {
        groups: ['create'],
      },
    )
    violation.town.code = this.town.id

    let sortPosition = 1
    violation.pictures = (violation.pictures || []).map(
      (picture: Picture): Picture => {
        picture.sortPosition = sortPosition
        sortPosition++

        return picture
      },
      [],
    )

    return violation
  }

  public toViolationContact(): ViolationContact {
    return plainToInstance<ViolationContactDto, Partial<ViolationDto>>(
      ViolationContactDto,
      this,
      {
        groups: ['contact'],
        excludeExtraneousValues: true,
      },
    )
  }

  public static fromProtocol(protocol: Protocol): ViolationDto {
    const protocolDto = ProtocolDto.fromEntity(protocol)
    const violationDto = new ViolationDto()
    violationDto.section = protocolDto.section
    violationDto.pictures = protocolDto.pictures
    return violationDto
  }

  public static fromEntity(
    violation: Violation,
    groups: string[] = ['read'],
  ): ViolationDto {
    const violationDto = plainToClass<ViolationDto, Partial<Violation>>(
      ViolationDto,
      violation,
      {
        excludeExtraneousValues: true,
        groups,
      },
    )

    let author: User | ViolationContact
    if (groups.includes('author_read') && (author = violation.getAuthor())) {
      if (author instanceof User) {
        violationDto.author = UserDto.fromEntity(author, ['author_read'])
      } else {
        violationDto.author = author
      }
    }

    violationDto.createdAt = (violation.updates || []).find(
      (update): boolean => update.type === ViolationUpdateType.SEND,
    )?.timestamp

    return violationDto
  }
}

export class ViolationContactDto implements ViolationContact {
  @Expose({ groups: ['contact'] })
  name: string

  @Expose({ groups: ['contact'] })
  email: string

  @Expose({ groups: ['contact'] })
  phone: string
}
