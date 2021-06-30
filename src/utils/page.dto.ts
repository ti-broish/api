import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Length, Min } from 'class-validator';

export class PageDTO {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page = 1;
}
