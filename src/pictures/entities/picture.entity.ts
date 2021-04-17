import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  AfterLoad,
} from 'typeorm';
import { ulid } from 'ulid';
import { User } from '../../users/entities';
import { PathInterface } from '../path.interface';

@Entity('pictures', { orderBy: { sortPosition: 'ASC' } })
export class Picture implements PathInterface {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @Column()
  path: string;

  @Column()
  sortPosition: number = 0;

  @Column()
  rotation: number = 0;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User)
  author: User;

  getPath(): string {
    return this.path;
  }
}
