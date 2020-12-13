import { User } from 'src/users/entities';
import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { ulid } from 'ulid';

@Entity('pictures')
export class Picture {
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
}
