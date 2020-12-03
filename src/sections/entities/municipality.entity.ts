import { Entity, Column, PrimaryColumn, OneToMany, ManyToMany } from 'typeorm';
import { ElectionRegion } from './electionRegion.entity';
import { Town } from './town.entity';

@Entity('municipalities')
export class Municipality {
  @PrimaryColumn()
  readonly id: number;

  @Column('char', { length: 2 })
  readonly code: string;

  @Column()
  readonly name: string;

  @ManyToMany(() => ElectionRegion, electionRegion => electionRegion.municipalities)
  readonly electionRegions: ElectionRegion[];

  @OneToMany(() => Town, town => town.country)
  readonly towns: Town[];
}
