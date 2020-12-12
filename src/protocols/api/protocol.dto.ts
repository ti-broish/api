import { ApiProperty, OmitType } from '@nestjs/swagger';
import { PictureDto } from '../../pictures/api/picture.dto';
import { ProtocolCreateDto } from './protocolCreate.dto';

export class Protocol extends OmitType(ProtocolCreateDto, ['pictures'] as const) {
  @ApiProperty()
  id: string;

  @ApiProperty()
  pictures: PictureDto[]
}
