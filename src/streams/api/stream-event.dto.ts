import { Exclude, Expose, Transform } from 'class-transformer'
import { IsDate, IsIn, IsNotEmpty, IsOptional, IsUrl } from 'class-validator'
import * as moment from 'moment'
import { IsStreamIdentifierExists } from './stream-exists.constraint'

const VIDEO_SERVICE_TIMESTAMP_PATTERN = /^\d{8}-\d{6}$/
const VIDEO_SERVICE_TIMESTAMP_FORMAT = 'YYYYMMDD-HHmmss'

@Exclude()
export class StreamEventDto {
  public static readonly START = 'start'
  public static readonly STOP = 'stop'
  public static readonly WEBHOOK_CHUNK_EVENTS = [
    StreamEventDto.START,
    StreamEventDto.STOP,
  ]

  @Expose()
  @IsIn(StreamEventDto.WEBHOOK_CHUNK_EVENTS)
  @IsNotEmpty()
  type: string

  @Expose({ name: 'stream' })
  @IsNotEmpty()
  @IsStreamIdentifierExists()
  identifier: string

  @Expose()
  @IsOptional()
  @IsDate({
    message:
      'start must match the following date format: ' +
      VIDEO_SERVICE_TIMESTAMP_FORMAT,
  })
  @Transform(({ value }) =>
    value && VIDEO_SERVICE_TIMESTAMP_PATTERN.test(value)
      ? moment(value, VIDEO_SERVICE_TIMESTAMP_FORMAT).toDate()
      : value,
  )
  start?: Date

  @Expose({ name: 'len' })
  @IsOptional()
  @IsDate({ message: 'duration must be a positive integer' })
  @Transform(({ value, obj }) =>
    /^[1-9]\d*$/.test(value)
      ? moment(obj.start, VIDEO_SERVICE_TIMESTAMP_FORMAT)
          .add(value, 'seconds')
          .toDate()
      : value,
  )
  end?: Date

  @Expose()
  @IsOptional()
  @IsUrl()
  url?: string
}
