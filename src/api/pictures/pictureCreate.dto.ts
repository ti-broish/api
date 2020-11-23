import { ApiProperty } from '@nestjs/swagger';

class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file: any;
}

export class PictureCreateDto {
  @ApiProperty({ required: true })
  binaryData: string;
}
