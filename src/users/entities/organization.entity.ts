import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => User, user => user.organization)
  users: User[];
}
