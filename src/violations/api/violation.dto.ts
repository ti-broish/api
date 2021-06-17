import {
  Exclude,
  Expose,
  plainToClass,
  Transform,
  Type,
} from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { SectionDto } from '../../sections/api/section.dto';
import { PictureDto } from '../../pictures/api/picture.dto';
import { Violation, ViolationStatus } from '../entities/violation.entity';
import { TownDto } from '../../sections/api/town.dto';
import { UserDto } from 'src/users/api/user.dto';
import { ViolationUpdateDto } from './violation-update.dto';
import { Picture } from 'src/pictures/entities/picture.entity';
import { Protocol } from '../../protocols/entities/protocol.entity';
import { ProtocolDto } from '../../protocols/api/protocol.dto';

@Exclude()
export class ViolationDto {
  @Expose({ groups: ['read'] })
  id: string;

  @Expose({ groups: ['read', 'create'] })
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
  section?: SectionDto;

  @Expose({ groups: ['read', 'create'] })
  @Type(() => TownDto)
  @Transform(
    ({ value: id }) => plainToClass(TownDto, { id }, { groups: ['create'] }),
    { groups: ['create'] },
  )
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    groups: ['create'],
  })
  town: TownDto;

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
  pictures: PictureDto[];

  @Expose({ groups: ['read', 'create'] })
  @MinLength(20, { groups: ['create'] })
  @MaxLength(2000, { groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  description: string;

  @Expose({ groups: ['read'] })
  status: ViolationStatus;

  @Expose({ groups: ['read', 'isPublishedUpdate'] })
  @IsBoolean({ groups: ['isPublishedUpdate'] })
  isPublished: boolean;

  @Expose({ groups: [UserDto.AUTHOR_READ] })
  @Type(() => UserDto)
  assignees: UserDto[];

  @Expose({ groups: ['violation.process'] })
  @Type(() => ViolationUpdateDto)
  updates: ViolationUpdateDto[];

  private author: UserDto;

  @Expose({ groups: [UserDto.AUTHOR_READ] })
  @Type(() => UserDto)
  getAuthor(): UserDto {
    return this.author;
  }

  public toEntity(): Violation {
    const violation = plainToClass<Violation, Partial<ViolationDto>>(
      Violation,
      this,
      {
        groups: ['create'],
      },
    );

    let sortPosition = 1;
    violation.pictures = (violation.pictures || []).map(
      (picture: Picture): Picture => {
        picture.sortPosition = sortPosition;
        sortPosition++;

        return picture;
      },
      [],
    );

    return violation;
  }

  public static fromProtocol(protocol: Protocol): ViolationDto {
    const protocolDto = ProtocolDto.fromEntity(protocol);
    const violationDto = new ViolationDto();
    violationDto.section = protocolDto.section;
    violationDto.pictures = protocolDto.pictures;
    return violationDto;
  }

  public static fromEntity(
    violation: Violation,
    additionalGroups: string[] = [],
  ): ViolationDto {
    const violationDto = plainToClass<ViolationDto, Partial<Violation>>(
      ViolationDto,
      violation,
      {
        excludeExtraneousValues: true,
        groups: ['read', ...additionalGroups],
      },
    );

    if (additionalGroups.includes(UserDto.AUTHOR_READ)) {
      violationDto.author = UserDto.fromEntity(violation.getAuthor(), [
        UserDto.AUTHOR_READ,
      ]);
    }

    return violationDto;
  }
}
