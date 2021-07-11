import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class StreamChunkDto {
  @Expose({ groups: ['stream.watch', 'stream.feed'] })
  id: string;

  @Expose({ groups: ['stream.watch', 'stream.feed'] })
  url?: string;

  @Expose({ groups: ['stream.watch', 'stream.feed'] })
  startTime: Date;

  @Expose({ groups: ['stream.watch', 'stream.feed'] })
  endTime?: Date;
}
