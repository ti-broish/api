import { ApiProperty } from '@nestjs/swagger';

export class Party {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  displayName: string
}
