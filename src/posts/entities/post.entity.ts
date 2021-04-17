import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
} from 'typeorm';
import { ulid } from 'ulid';
import { Picture } from '../../pictures/entities/picture.entity';
import { User } from '../../users/entities';
import { Broadcast } from '../../broadcasts/entities/broadcast.entity';

@Entity('posts')
export class Post {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column()
  contents: string;

  @ManyToOne(() => User)
  author: User;

  @ManyToOne(() => Picture)
  picture?: Picture;

  @Column({ type: 'boolean' })
  isListed: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  publishAt: Date;
}
