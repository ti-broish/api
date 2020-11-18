import { ApiProperty } from '@nestjs/swagger';

export class Country {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  isForeign: boolean;
}
