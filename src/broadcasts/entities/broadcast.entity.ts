import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { ulid } from 'ulid';
import { User } from '../../users/entities';

export enum BroadcastStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  DISABLED = 'disabled',
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
}
