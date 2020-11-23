import { ApiProperty } from '@nestjs/swagger';

export class ProtocolCreateDto {
  @ApiProperty({ required: true })
  section: string;

  @ApiProperty({ required: true })
  pictures: Array<number>

  @ApiProperty()
  data: object;
}
