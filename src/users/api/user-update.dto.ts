import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { OrganizationDto } from './organization.dto';

export class UserUpdateDto {
  @ApiProperty({ required: false })
  firstName: string;

  @ApiProperty({ required: false })
  lastName: string;

  @ApiProperty({ required: false })
  email: string;

  @ApiProperty({ required: false })
  phone: string;

  @ApiProperty({ required: false })
  pin: string;

  @ApiProperty({ required: false })
  organization: OrganizationDto;

  public updateEntity(user: User): User {
    user.firstName = this.firstName ?? user.firstName;
    user.lastName = this.lastName ?? user.lastName;
    user.email = this.email ?? user.email;
    user.phone = this.phone ?? user.phone;
    user.phone = this.phone ?? user.phone;

    return user;
  }
}
