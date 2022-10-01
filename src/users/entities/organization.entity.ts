import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

export enum OrganizationType {
  PARTY = 'party',
  COMMISSION = 'commission',
  WATCHERS = 'watchers',
}
@Entity('organizations', {
  orderBy: { sortPosition: 'ASC' },
})
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @Column()
  type: OrganizationType;

  @Column()
  sortPosition: number;

  @Column()
  isHidden: boolean;
}
