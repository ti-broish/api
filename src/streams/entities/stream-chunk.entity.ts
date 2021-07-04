import { Section } from 'src/sections/entities';
import { User } from 'src/users/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { Stream } from './stream.entity';

@Entity('stream_chunks')
export class StreamChunk {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @ManyToOne(() => Stream, (stream: Stream) => stream.chunks)
  @JoinColumn({ name: 'stream_id' })
  stream: Stream;

  @ManyToOne(() => Section)
  section: Section;

  @ManyToOne(() => User)
  author: User;

  @Column()
  url?: string;

  @Column()
  isActive: boolean;

  @CreateDateColumn({ name: 'start_timestamp' })
  startTime: Date;

  @Column('timestamp', { name: 'end_timestamp' })
  endTime?: Date;
}
