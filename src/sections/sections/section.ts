import { ApiProperty } from '@nestjs/swagger';

export class Section {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;
}
