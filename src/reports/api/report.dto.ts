import { ApiProperty, OmitType } from '@nestjs/swagger';
import { PictureDto } from '../../pictures/api/picture.dto';
import { ReportCreateDto } from './reportCreate.dto';

export class Report extends OmitType(ReportCreateDto, ['pictures'] as const) {
  @ApiProperty()
  id: string;

  @ApiProperty()
  pictures: Array<PictureDto> | null
}
