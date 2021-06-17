import { ApiProperty } from '@nestjs/swagger';

/* TODO ?!? */
// class FileUploadDto {
//   @ApiProperty({ type: 'string', format: 'binary', required: true })
//   file: any;
// }
/* TODO ?!? */

export class PictureCreateDto {
  @ApiProperty({ required: true })
  binaryData: string;
}
