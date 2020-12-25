import { Protocol } from 'src/protocols/entities/protocol.entity';
import { User } from 'src/users/entities';
import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, ManyToMany } from 'typeorm';
import { ulid } from 'ulid';
import { PathInterface } from '../path.interface';

@Entity('pictures')
export class Picture implements PathInterface {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @Column()
  path: string;

  @Column()
  sortPosition: number = 0;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User)
  author: User;

  getPath(): string {
    return this.path;
  }
}
