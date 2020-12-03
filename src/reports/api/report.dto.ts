import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Picture } from '../../pictures/api/picture.dto';
import { ReportCreateDto } from './reportCreate.dto';

export class Report extends OmitType(ReportCreateDto, ['pictures'] as const) {
  @ApiProperty()
  id: string;

  @ApiProperty()
  pictures: Array<Picture> | null
}
