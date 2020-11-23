import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Picture } from '../pictures/picture';
import { ProtocolCreateDto } from './protocolCreate.dto';

export class Protocol extends OmitType(ProtocolCreateDto, ['pictures'] as const) {
  @ApiProperty()
  id: string;

  @ApiProperty()
  pictures: Array<Picture>
}
