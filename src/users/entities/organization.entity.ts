import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { User } from './user.entity';

export enum OrganizationType {
  PARTY = 'party',
  COMMISSION = 'commission',
  WATCHERS = 'watchers',
};
@Entity('organizations', {
  orderBy: { id: 'ASC' },
})
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => User, user => user.organization)
  users: User[];

  @Column()
  type: OrganizationType;
}
