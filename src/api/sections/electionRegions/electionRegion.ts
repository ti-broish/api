import { ApiProperty } from '@nestjs/swagger';

export class ElectionRegion {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  isForeign: boolean;
}
