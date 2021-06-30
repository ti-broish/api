import { ulid } from 'ulid';
import { Section } from 'src/sections/entities';
import { User } from 'src/users/entities';
import { Entity, CreateDateColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('checkins', {
  orderBy: {
    timestamp: 'DESC',
  },
})
export class Checkin {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @ManyToOne(() => User, (user: User) => user.checkins)
  actor: User;

  @ManyToOne(() => Section, (section) => section.violations)
  section?: Section;

  @CreateDateColumn()
  timestamp: Date;
}
