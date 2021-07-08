import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class StreamChunkDto {
  @Expose({ groups: ['stream.watch'] })
  id: string;

  @Expose({ groups: ['stream.watch'] })
  url?: string;

  @Expose({ groups: ['stream.watch'] })
  startTime: Date;

  @Expose({ groups: ['stream.watch'] })
  endTime?: Date;
}
