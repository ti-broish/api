import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  classToPlain,
  Exclude,
  Expose,
  plainToClass,
  Transform,
  Type,
} from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumberString,
  IsPhoneNumber,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { assignWith } from 'lodash';
import { Role } from 'src/casl/role.enum';
import { SectionDto } from 'src/sections/api/section.dto';
import { User } from '../entities/user.entity';
import { OrganizationDto } from './organization.dto';
import { IsUserExists } from './user-exists.constraint';

@Exclude()
export class UserDto {
  public static readonly READ = 'read';
  public static readonly ADMIN_READ = 'admin_read';
  public static readonly ME_READ = 'me_read';
  public static readonly AUTHOR_READ = 'author_read';
  public static readonly CREATE = 'create';
  public static readonly UPDATE = 'update';
  public static readonly MANAGE = 'manage';

  @Expose({
    groups: [
      'broadcast.create',
      UserDto.READ,
      UserDto.ME_READ,
      UserDto.ADMIN_READ,
      UserDto.MANAGE,
      'assignee',
      'author_read',
    ],
  })
  @IsUserExists({
    groups: ['broadcast.create', 'assignee'],
    message: 'USER_DOES_NOT_EXIST',
  })
  @IsString({
    groups: ['broadcast.create', 'assignee'],
    message: 'USER_ID_STRING',
  })
  @IsNotEmpty({
    groups: ['broadcast.create', 'assignee'],
    message: 'USER_ID_NOT_EMPTY',
  })
  id: string;

  @ApiProperty({ required: true })
  @Expose({
    groups: [
      UserDto.ME_READ,
      UserDto.ADMIN_READ,
      UserDto.CREATE,
      UserDto.UPDATE,
      'author_read',
    ],
  })
  @IsNotEmpty({
    groups: [UserDto.CREATE],
    message: 'USER_FIRST_NAME_NOT_EMPTY',
  })
  @IsString({
    groups: [UserDto.CREATE, UserDto.UPDATE],
    message: 'USER_FIRST_NAME_STRING',
  })
  @Length(1, 100, {
    groups: [UserDto.CREATE, UserDto.UPDATE],
    message: 'USER_FIRST_NAME_LENGTH',
  })
  firstName: string;

  @ApiProperty({ required: true })
  @Expose({
    groups: [
      UserDto.ME_READ,
      UserDto.ADMIN_READ,
      UserDto.CREATE,
      UserDto.UPDATE,
      'author_read',
    ],
  })
  @IsNotEmpty({
    groups: [UserDto.CREATE],
    message: 'USER_LAST_NAME_NOT_EMPTY',
  })
  @IsString({
    groups: [UserDto.CREATE, UserDto.UPDATE],
    message: 'USER_LAST_NAME_STRING',
  })
  @Length(1, 100, {
    groups: [UserDto.CREATE, UserDto.UPDATE],
    message: 'USER_LAST_NAME_LENGTH',
  })
  lastName: string;

  @ApiProperty({ required: true })
  @Expose({
    groups: [
      UserDto.ME_READ,
      UserDto.ADMIN_READ,
      UserDto.CREATE,
      UserDto.UPDATE,
      'author_read',
    ],
  })
  @IsNotEmpty({
    groups: [UserDto.CREATE],
    message: 'USER_EMAIL_NOT_EMPTY',
  })
  @IsEmail(
    {},
    {
      groups: [UserDto.CREATE, UserDto.UPDATE],
      message: 'USER_EMAIL_INVALID',
    },
  )
  @Length(1, 100, {
    groups: [UserDto.CREATE, UserDto.UPDATE],
    message: 'USER_EMAIL_LENGTH',
  })
  @Transform(
    ({ value: email }: { value: string }) =>
      email ? email.toLowerCase() : email,
    {
      groups: [UserDto.CREATE, UserDto.UPDATE],
    },
  )
  email: string;

  @ApiProperty({ required: true })
  @Expose({
    groups: [
      UserDto.ME_READ,
      UserDto.ADMIN_READ,
      UserDto.CREATE,
      UserDto.UPDATE,
      'author_read',
    ],
  })
  @IsNotEmpty({
    groups: [UserDto.CREATE],
    message: 'USER_PHONE_NOT_EMPTY',
  })
  @IsPhoneNumber(null, {
    groups: [UserDto.CREATE, UserDto.UPDATE],
    message: 'USER_PHONE_INVALID',
  })
  phone: string;

  @ApiProperty({ required: true })
  @Expose({
    groups: [
      UserDto.ME_READ,
      UserDto.ADMIN_READ,
      UserDto.CREATE,
      UserDto.UPDATE,
    ],
  })
  @IsNotEmpty({
    groups: [UserDto.CREATE],
    message: 'USER_PIN_NOT_EMPTY',
  })
  @IsNumberString(
    {},
    {
      groups: [UserDto.CREATE, UserDto.UPDATE],
      message: 'USER_PIN_NUMERIC',
    },
  )
  @Length(4, 4, {
    groups: [UserDto.CREATE, UserDto.UPDATE],
    message: 'USER_PIN_LENGTH',
  })
  pin: string;

  @ApiProperty({ required: true })
  @Expose({
    groups: [
      UserDto.ME_READ,
      UserDto.ADMIN_READ,
      UserDto.CREATE,
      UserDto.UPDATE,
      'protocol.validate',
      'author_read',
    ],
  })
  @Type(() => OrganizationDto)
  @IsNotEmpty({
    groups: [UserDto.CREATE, UserDto.UPDATE],
    message: 'USER_ORGANIZATION_NOT_EMPTY',
  })
  @IsNotEmptyObject(
    { nullable: true },
    {
      groups: [UserDto.CREATE, UserDto.UPDATE],
      message: 'USER_ORGANIZATION_NOT_EMPTY_OBJECT',
    },
  )
  @ValidateNested({
    groups: [UserDto.CREATE, UserDto.UPDATE],
    message: 'USER_ORGANIZATION_INVALID',
  })
  organization: OrganizationDto;

  @ApiProperty({ required: true })
  @Expose({ groups: [UserDto.ME_READ, UserDto.ADMIN_READ, UserDto.CREATE] })
  @IsNotEmpty({
    groups: [UserDto.CREATE],
    message: 'USER_FIREBASE_UID_NOT_EMPTY',
  })
  firebaseUid: string;

  @ApiPropertyOptional()
  @Expose({
    groups: [
      UserDto.ME_READ,
      UserDto.ADMIN_READ,
      UserDto.CREATE,
      UserDto.UPDATE,
    ],
  })
  @IsNotEmpty({
    groups: [UserDto.CREATE, UserDto.UPDATE],
    message: 'USER_HAS_AGREED_TO_KEEP_DATA_NOT_EMPTY',
  })
  @IsBoolean({
    groups: [UserDto.CREATE, UserDto.UPDATE],
    message: 'USER_HAS_AGREED_TO_KEEP_DATA_BOOLEAN',
  })
  hasAgreedToKeepData: boolean;

  @ApiPropertyOptional()
  @Expose({
    groups: [
      UserDto.ME_READ,
      UserDto.ADMIN_READ,
      UserDto.MANAGE,
      'author_read',
    ],
  })
  roles: Role[];

  @Expose({ groups: ['read'] })
  @Type(() => SectionDto)
  section: SectionDto;

  public static fromEntity(
    entity: User,
    groups: string[] = [UserDto.READ],
  ): UserDto {
    return plainToClass<UserDto, Partial<User>>(UserDto, entity, {
      excludeExtraneousValues: true,
      groups: groups,
    });
  }

  public toEntity(): User {
    return plainToClass<User, Partial<UserDto>>(User, this, {
      groups: [UserDto.CREATE],
    });
  }

  public updateEntity(user: User, groups: string[] = [UserDto.UPDATE]): User {
    const updatedKeys = classToPlain<UserDto>(this, {
      excludeExtraneousValues: false,
      groups: groups,
    });

    return assignWith(
      user,
      updatedKeys,
      UserDto.preferOriginalValueIfUpdatedIsUndefined,
    );
  }

  private static preferOriginalValueIfUpdatedIsUndefined(
    originalValue: any,
    newValue: any,
  ) {
    return newValue === undefined ? originalValue : newValue;
  }
}
