import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  Matches,
  Min,
} from 'class-validator';

const VIDEO_SERVICE_TIMESTAMP_PATTERN = /202[1-9][01]\d{3}-\d{6}/;

@Exclude()
export class StreamWebhookDto {
  public static readonly START = 'start';
  public static readonly STOP = 'stop';
  public static readonly WEBHOOK_CHUNK_EVENTS = [
    StreamWebhookDto.START,
    StreamWebhookDto.STOP,
  ];

  @Expose()
  @IsIn(StreamWebhookDto.WEBHOOK_CHUNK_EVENTS)
  @IsNotEmpty()
  type: string;

  @Expose({ name: 'stream' })
  @IsNotEmpty()
  identifier: string;

  @Expose()
  @Matches(VIDEO_SERVICE_TIMESTAMP_PATTERN)
  start?: string;

  @Expose()
  @IsOptional()
  @IsUrl()
  url?: string;

  @Expose({ name: 'len' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;
}
