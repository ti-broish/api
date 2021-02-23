import { Protocol } from 'src/protocols/entities/protocol.entity';
import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { ulid } from 'ulid';
import { Role } from '../../casl/role.enum';
import { Picture } from '../../pictures/entities/picture.entity';
import { Client } from './client.entity';
import { Organization } from './organization.entity';

@Entity('people')
export class User {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column()
  pin: string;

  @ManyToOne(() => Organization, organization => organization.users)
  organization: Organization;

  @OneToMany(() => Picture, picture => picture.author, {
    onDelete: 'CASCADE',
  })
  pictures: Picture[];

  @Column({ unique: true })
  firebaseUid: string;

  @Column()
  hasAgreedToKeepData: boolean;

  @Column('simple-json')
  roles: Role[] = [Role.User];

  @OneToMany(() => Client, client => client.owner, {
    cascade: ['remove'],
  })
  clients: Client[];

  @ManyToMany(() => Protocol)
  @JoinTable({
    name: 'protocols_assignees',
    joinColumn: { name: 'assignee_id' },
    inverseJoinColumn: { name: 'protocol_id' },
  })
  assignedProtocols: Protocol[];

  @CreateDateColumn({ type: 'timestamp' })
  registeredAt: Date;

  hasRole(role: Role): boolean {
    return this.roles.includes(role);
  }
}
