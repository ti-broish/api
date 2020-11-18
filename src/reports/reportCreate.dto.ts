import { ApiProperty } from '@nestjs/swagger';

export class ReportCreateDto {
  @ApiProperty({ required: true })
  section: string;

  @ApiProperty()
  pictures: Array<number> | null

  @ApiProperty({ required: true })
  description: string
}
