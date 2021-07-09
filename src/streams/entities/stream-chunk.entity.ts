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

  @Column()
  url?: string;

  @Column()
  isActive: boolean;

  @CreateDateColumn({ name: 'start_timestamp' })
  startTime: Date;

  @Column('timestamp', { name: 'end_timestamp' })
  endTime?: Date;

  static start(): StreamChunk {
    const chunk = new StreamChunk();
    chunk.isActive = true;

    return chunk;
  }

  stop(start: Date, end: Date, url: string): void {
    this.isActive = false;
    this.startTime = start;
    this.endTime = end;
    this.url = url;
  }
}
