import { ApiProperty } from '@nestjs/swagger';

export class Picture {
  @ApiProperty()
  id: string;

  @ApiProperty()
  path: string;
}
