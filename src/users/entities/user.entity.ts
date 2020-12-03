import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, Index } from 'typeorm';
import { ulid } from 'ulid';
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

  @Column({ unique: true })
  firebaseUid: string;

  @Column()
  hasAgreedToKeepData: boolean;

  @Column('simple-json')
  roles: string[] = ['user'];

  @CreateDateColumn({ type: 'timestamp' })
  registeredAt: Date;
}
