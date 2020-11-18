import { ApiProperty } from '@nestjs/swagger';

export class Organization {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}
