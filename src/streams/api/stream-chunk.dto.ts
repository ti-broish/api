import { Exclude, Expose } from 'class-transformer';
import { User } from '../../users/entities';

@Exclude()
export class StreamChunkDto {
  @Expose({ groups: ['stream.watch'] })
  id: string;

  author: User;

  @Expose({ groups: ['stream.watch'] })
  url?: string;

  @Expose({ groups: ['stream.watch'] })
  startTime: Date;

  @Expose({ groups: ['stream.watch'] })
  endTime?: Date;
}
