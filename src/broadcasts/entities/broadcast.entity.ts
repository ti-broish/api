import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { ulid } from 'ulid';
import { User } from '../../users/entities';

export enum BroadcastStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  DISCARDED = 'discarded',
}

export enum BroadcastTopic {
  ADMINS = 'role.admin',
  LAWYERS = 'role.lawyer',
  VALIDATORS = 'role.validator',
  REPRESENTATIVES = 'role.representative',
}

export enum BroadcastType {
  POST = 'post',
  URL = 'url',
}

type BroadcastData = {
  type: BroadcastType;
  postId?: string;
  url?: string;
};

@Entity('broadcasts')
export class Broadcast {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @Column()
  title: string;

  @Column()
  contents: string;

  @ManyToOne(() => User)
  author: User;

  @Column({ type: 'varchar' })
  status: BroadcastStatus;

  @Column({ type: 'simple-array' })
  topics: BroadcastTopic[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'broadcasts_users',
    joinColumn: { name: 'broadcast_id' },
    inverseJoinColumn: { name: 'user_id' },
  })
  users: User[];

  @Column({ type: 'simple-json' })
  data: BroadcastData;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  publishAt: Date;

  setInitialStatus(author: User): void {
    if (this.status !== undefined) {
      throw new Error('Broadcast status can be set to pending only when unset');
    }
    this.author = author;
    this.status = BroadcastStatus.PENDING;
  }

  process(): void {
    if (this.status !== BroadcastStatus.PENDING) {
      throw new Error('Broadcast status can be set to processing only when pending');
    }
    this.status = BroadcastStatus.PROCESSING;
  }

  publish(): void {
    if (this.status !== BroadcastStatus.PROCESSING) {
      throw new Error('Broadcast status can be set to published only when processing');
    }
    this.status = BroadcastStatus.PUBLISHED;
  }

  discard(): void {
    if (this.status !== BroadcastStatus.PENDING) {
      throw new Error('Broadcast status can be set to discarded only when pending');
    }
    this.status = BroadcastStatus.DISCARDED;
  }
}
