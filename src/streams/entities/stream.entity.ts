import { Section } from 'src/sections/entities';
import { User } from 'src/users/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { StreamChunk } from './stream-chunk.entity';

@Entity('streams')
export class Stream {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @ManyToOne(() => Section)
  section?: Section;

  @OneToMany(
    () => StreamChunk,
    (streamChunk: StreamChunk) => streamChunk.stream,
    {
      cascade: ['insert', 'update'],
    },
  )
  chunks: StreamChunk[];

  @OneToOne(() => User, (user: User) => user.stream)
  user: User;

  @Column({ name: 'stream_identifier' })
  identifier: string;

  @Column()
  streamUrl: string;

  @Column()
  broadcastUrl: string;

  @Column()
  isStreaming: boolean;

  @Column()
  isAssigned: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @Column()
  isCensored: boolean;

  assign(user: User, section: Section): void {
    if (this.isAssigned) {
      throw new Error('Cannot assign an already assigned stream!');
    }

    this.isAssigned = true;
    this.section = section;
    user.section = section;
    user.stream = this;
  }

  get viewUrl(): string | null {
    if (!this.section) {
      return null;
    }

    const resultsUrl = process.env.CANONICAL_RESULTS.replace(/\/$/, '');

    return `${resultsUrl}/${this.section.id}`;
  }

  addChunk(chunk: StreamChunk): void {
    this.chunks.push(chunk);
  }

  start(): StreamChunk {
    if (this.isStreaming != false) {
      throw new StreamingError(
        'StreamingAlreadyStoppedError',
        'Trying to start a stream that has already been started',
      );
    }

    if (this.isCensored != false) {
      throw new StreamingError(
        'StreamingIsCensoredError',
        'Cannot start censored stream',
      );
    }

    this.isStreaming = true;
    const chunk = StreamChunk.start();
    this.addChunk(chunk);

    return chunk;
  }

  stop(start: Date, end: Date, url: string): void {
    if (this.isStreaming != true) {
      throw new StreamingError(
        'StreamingAlreadyStoppedError',
        'Trying to stop a stream that has already been stopped',
      );
    }

    let lastActiveChunk: StreamChunk | undefined = this.chunks.find(
      (chunk: StreamChunk): boolean => chunk.isActive === true,
    );
    if (lastActiveChunk !== undefined) {
      lastActiveChunk = this.start();
    }

    lastActiveChunk.stop(start, end, url);
    this.isStreaming = false;
  }
}

export class StreamingError implements Error {
  constructor(public name: string, public message: string) {}
}
