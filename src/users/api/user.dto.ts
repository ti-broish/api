import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { classToPlain, Exclude, Expose, plainToClass, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsNotEmptyObject, IsNumberString, IsPhoneNumber, IsString, Length, ValidateNested } from 'class-validator';
import { assign, assignWith, merge } from 'lodash';
import { Role } from 'src/casl/role.enum';
import { User } from '../entities/user.entity';
import { OrganizationDto } from './organization.dto';
import { IsUserExists } from './user-exists.constraint';

@Exclude()
export class UserDto {
  public static readonly READ = 'read';
  public static readonly CREATE = 'create';
  public static readonly UPDATE = 'update';
  public static readonly MANAGE = 'manage';

  @Expose({ groups: [ 'broadcast.create', UserDto.READ, UserDto.MANAGE, 'assignee'] })
  @IsUserExists({ groups: ['broadcast.create', 'assignee'] })
  @IsString({ groups: ['broadcast.create', 'assignee'] })
  @IsNotEmpty({ groups: ['broadcast.create', 'assignee'] })
  id: string;

  @ApiProperty({ required: true })
  @Expose({ groups: [UserDto.READ, UserDto.CREATE, UserDto.UPDATE] })
  @IsNotEmpty({ groups: [UserDto.CREATE] })
  @IsString({ groups: [UserDto.CREATE, UserDto.UPDATE] })
  @Length(1, 100)
  firstName: string;

  @ApiProperty({ required: true })
  @Expose({ groups: [UserDto.READ, UserDto.CREATE, UserDto.UPDATE] })
  @IsNotEmpty({ groups: [UserDto.CREATE] })
  @IsString({ groups: [UserDto.CREATE, UserDto.UPDATE] })
  @Length(1, 100)
  lastName: string;

  @ApiProperty({ required: true })
  @Expose({ groups: [UserDto.READ, UserDto.CREATE, UserDto.UPDATE] })
  @IsNotEmpty({ groups: [UserDto.CREATE] })
  @IsEmail({}, { groups: [UserDto.CREATE, UserDto.UPDATE] })
  @Length(1, 100)
  email: string;

  @ApiProperty({ required: true })
  @Expose({ groups: [UserDto.READ, UserDto.CREATE, UserDto.UPDATE] })
  @IsNotEmpty({ groups: [UserDto.CREATE] })
  @IsPhoneNumber(null, { groups: [UserDto.CREATE, UserDto.UPDATE] })
  phone: string;

  @ApiProperty({ required: true })
  @Expose({ groups: [UserDto.READ,  UserDto.CREATE, UserDto.UPDATE] })
  @IsNotEmpty({ groups: [UserDto.CREATE] })
  @IsNumberString({}, { groups: [UserDto.CREATE, UserDto.UPDATE] })
  @Length(4, 4, { groups: [UserDto.CREATE, UserDto.UPDATE] })
  pin: string;

  @ApiProperty({ required: true })
  @Expose({ groups: [UserDto.READ, UserDto.CREATE, UserDto.UPDATE] })
  @Type(() => OrganizationDto)
  @IsNotEmpty({ groups: [UserDto.CREATE, UserDto.UPDATE] })
  @IsNotEmptyObject({ groups: [UserDto.CREATE, UserDto.UPDATE] })
  @ValidateNested({ groups: [UserDto.CREATE, UserDto.UPDATE] })
  organization: OrganizationDto;

  @ApiProperty({ required: true })
  @Expose({ groups: [UserDto.READ, UserDto.CREATE] })
  @IsNotEmpty({ groups: [UserDto.CREATE] })
  firebaseUid: string;

  @ApiPropertyOptional()
  @Expose({ groups: [UserDto.CREATE] })
  @IsNotEmpty({ groups: [UserDto.CREATE] })
  @IsBoolean({ groups: [UserDto.CREATE] })
  hasAgreedToKeepData: boolean;

  @ApiPropertyOptional()
  @Expose({ groups: [UserDto.READ, UserDto.MANAGE] })
  roles: Role[];

  public static fromEntity(entity: User): UserDto {
    return plainToClass<UserDto, Partial<User>>(UserDto, entity, {
      excludeExtraneousValues: true,
      groups: [UserDto.READ],
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

    return assignWith(user, updatedKeys, UserDto.preferOriginalValueIfUpdatedIsUndefined);
  }

  private static preferOriginalValueIfUpdatedIsUndefined(originalValue: any, newValue: any) {
    return newValue === undefined ? originalValue : newValue;
  }
}
