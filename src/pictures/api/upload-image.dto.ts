import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

@Exclude()
export class UploadImageDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  image: string;
}
