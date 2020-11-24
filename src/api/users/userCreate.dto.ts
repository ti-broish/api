import { ApiProperty } from '@nestjs/swagger';

export class UserCreateDto {
  @ApiProperty({ required: true })
  firstName: string;

  @ApiProperty({ required: true })
  lastName: string;

  @ApiProperty({ required: true })
  email: string;

  @ApiProperty({ required: true })
  phone: string;

  @ApiProperty({ required: true })
  pin: string;

  @ApiProperty({ required: true })
  organization: number;
}
