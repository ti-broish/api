import { Exclude, Expose, plainToClass, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { SectionDto } from '../../sections/api/section.dto';
import { PictureDto } from '../../pictures/api/picture.dto';
import { Violation, ViolationStatus } from '../entities/violation.entity';
import { TownDto } from '../../sections/api/town.dto';
import { UserDto } from 'src/users/api/user.dto';
import { ViolationUpdateDto } from './violation-update.dto';

@Exclude()
export class ViolationDto{
  @Expose({ groups: ['read'] })
  id: string;

  @Expose({ groups: ['read', 'create'] })
  @Type(() => SectionDto)
  @ValidateIf((violationDto: ViolationDto) => violationDto.town !== undefined)
  @Transform((id: string) => id ? plainToClass(SectionDto, { id }, { groups: ['create'] }) : undefined, { groups: ['create'] })
  @ValidateNested({
    groups: ['create'],
  })
  section?: SectionDto;

  @Expose({ groups: ['read', 'create'] })
  @Type(() => TownDto)
  @Transform((id: string) => plainToClass(TownDto, { id }, { groups: ['create'] }), { groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    groups: ['create'],
  })
  town: TownDto;

  @Expose({ groups: ['read', 'create'] })
  @Type(() => PictureDto)
  @Transform((ids: string[]) => Array.isArray(ids) ? ids.map(id => plainToClass(PictureDto, { id }, { groups: ['create'] })): ids, { groups: ['create'] })
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
    return plainToClass<Violation, Partial<ViolationDto>>(Violation, this, {
      groups: ['create'],
    });
  }

  public static fromEntity(violation: Violation, additionalGroups: string[] = []): ViolationDto {
    const violationDto = plainToClass<ViolationDto, Partial<Violation>>(ViolationDto, violation, {
      excludeExtraneousValues: true,
      groups: ['read', ...additionalGroups],
    });

    if (additionalGroups.includes(UserDto.AUTHOR_READ)) {
      violationDto.author = UserDto.fromEntity(violation.getAuthor(), [UserDto.AUTHOR_READ]);
    }

    return violationDto;
  }
}
