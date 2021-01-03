import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, ManyToMany } from 'typeorm';
import { ulid } from 'ulid';
import { User } from '.';
import { Broadcast } from '../../posts/entities/broadcast.entity';

@Entity('clients')
export class Client {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @Column()
  token: string;

  @ManyToOne(() => User, owner => owner.clients)
  owner: User;

  @Column({ type: 'boolean' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  registeredAt: Date;

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }
}
