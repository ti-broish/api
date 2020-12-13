import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { classToPlain, Exclude, Expose, plainToClass, serialize, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumberString, IsPhoneNumber, IsString, Length, ValidateNested } from 'class-validator';
import { User } from '../entities/user.entity';
import { OrganizationDto } from './organization.dto';

@Exclude()
export class UserDto {
  public static readonly READ = 'read';
  public static readonly CREATE = 'create';
  public static readonly UPDATE = 'update';

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
  @IsNotEmpty({ groups: [UserDto.CREATE] })
  @ValidateNested({ groups: [UserDto.CREATE, UserDto.UPDATE] })
  organization: OrganizationDto;

  @ApiProperty({ required: true })
  @Expose({ groups: [UserDto.READ, UserDto.CREATE] })
  @IsNotEmpty({ groups: [UserDto.CREATE] })
  firebaseUid: string;

  @ApiPropertyOptional()
  @Expose({ groups: [UserDto.CREATE] })
  @IsNotEmpty({ groups: [UserDto.CREATE] })
  @IsBoolean({ groups: [UserDto.CREATE, UserDto.UPDATE] })
  hasAgreedToKeepData: boolean;

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

  public updateEntity(user: User): User {
    const updateDto = JSON.parse(serialize(classToPlain<UserDto>(this, {
      excludeExtraneousValues: false,
      groups: [UserDto.UPDATE],
    })));

    return Object.assign(user, updateDto);
  }
}
