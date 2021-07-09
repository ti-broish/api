import { ApiProperty } from '@nestjs/swagger';
import {
  Exclude,
  Expose,
  plainToClass,
  Transform,
  Type,
} from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { SectionDto } from 'src/sections/api/section.dto';
import { StreamChunkDto } from './stream-chunk.dto';
import { Stream } from '../entities/stream.entity';

@Exclude()
export class StreamDto {
  public static READ = 'stream.read';
  public static CREATE = 'stream.create';
  public static WATCH = 'stream.watch';

  @Expose({ groups: [StreamDto.READ, StreamDto.WATCH] })
  id: string;

  @Expose({ groups: [StreamDto.WATCH] })
  isStreaming: boolean;

  isAssigned: boolean;

  @Expose({ groups: [StreamDto.READ] })
  streamUrl: string;

  @Expose({ groups: [StreamDto.WATCH] })
  broadcastUrl: string;

  @Expose({ groups: [StreamDto.READ] })
  viewUrl?: string;

  @ApiProperty({ required: true })
  @Expose({ groups: [StreamDto.READ, StreamDto.CREATE, StreamDto.WATCH] })
  @Type(() => SectionDto)
  @Transform(
    ({ value: id }) =>
      plainToClass(SectionDto, { id }, { groups: [StreamDto.CREATE] }),
    { groups: [StreamDto.CREATE] },
  )
  @IsNotEmpty({ groups: [StreamDto.CREATE] })
  @ValidateNested({
    groups: [StreamDto.CREATE],
  })
  section?: SectionDto;

  @Expose({ groups: [StreamDto.WATCH] })
  @Type(() => StreamChunkDto)
  chunks: StreamChunkDto[] = [];

  public static fromEntity(
    entity: Stream,
    groups: string[] = [StreamDto.READ],
  ): StreamDto {
    return plainToClass<StreamDto, Partial<Stream>>(StreamDto, entity, {
      excludeExtraneousValues: false,
      groups: groups,
    });
  }

  public toEntity(): Stream {
    return plainToClass<Stream, Partial<StreamDto>>(Stream, this, {
      groups: [StreamDto.CREATE],
    });
  }
}
