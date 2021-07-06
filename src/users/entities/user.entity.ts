import { Checkin } from 'src/checkins/entities/checkin.entity';
import { Protocol } from 'src/protocols/entities/protocol.entity';
import { Section } from 'src/sections/entities';
import { Stream } from 'src/streams/entities/stream.entity';
import { Violation } from 'src/violations/entities/violation.entity';
import {
  Entity,
  Column,
  ManyToOne,
  CreateDateColumn,
  PrimaryColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
} from 'typeorm';
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

  @ManyToOne(() => Organization, (organization) => organization.users)
  organization: Organization;

  @OneToMany(() => Picture, (picture) => picture.author, {
    onDelete: 'CASCADE',
  })
  pictures: Picture[];

  @Column({ unique: true })
  firebaseUid: string;

  @Column()
  hasAgreedToKeepData: boolean;

  @Column()
  isEmailVerified: boolean = false;

  @Column('simple-json')
  roles: Role[] = [Role.User, Role.Streamer];

  @OneToMany(() => Client, (client) => client.owner, {
    cascade: ['remove'],
    onDelete: 'CASCADE',
  })
  clients: Client[];

  @OneToMany(() => Checkin, (checkin) => checkin.actor, {
    cascade: ['remove'],
    onDelete: 'CASCADE',
  })
  checkins: Checkin[];

  @ManyToMany(() => Protocol)
  @JoinTable({
    name: 'protocols_assignees',
    joinColumn: { name: 'assignee_id' },
    inverseJoinColumn: { name: 'protocol_id' },
  })
  assignedProtocols: Protocol[];

  @ManyToMany(() => Protocol)
  @JoinTable({
    name: 'violations_assignees',
    joinColumn: { name: 'assignee_id' },
    inverseJoinColumn: { name: 'violation_id' },
  })
  assignedViolations: Violation[];

  @OneToOne(() => Stream, {
    cascade: ['update'],
  })
  @JoinColumn({ name: 'stream_id' })
  stream: Stream;

  @ManyToOne(() => Section, { eager: true })
  section: Section;

  @CreateDateColumn({ type: 'timestamp' })
  registeredAt: Date;

  hasRole(role: Role): boolean {
    return this.roles.includes(role);
  }
}
