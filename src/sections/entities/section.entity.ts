import { Entity, Column, ManyToOne, PrimaryColumn, OneToMany } from 'typeorm';
import { Violation } from '../../violations/entities/violation.entity';
import { Protocol } from '../../protocols/entities/protocol.entity';
import { CityRegion } from './cityRegion.entity';
import { ElectionRegion } from './electionRegion.entity';
import { Town } from './town.entity';
import { StatsDto } from 'src/results/api/stats.dto';

@Entity('sections')
export class Section {

  public static readonly SECTION_ID_LENGTH = 9;

  @PrimaryColumn('char', { length: Section.SECTION_ID_LENGTH })
  id: string;

  @Column('char', { length: 3 })
  code: string;

  @Column()
  place: string;

  @Column()
  votersCount: number;

  @Column()
  isMachine: boolean;

  @Column()
  isMobile: boolean;

  @Column()
  isShip: boolean;

  @ManyToOne(() => ElectionRegion, electionRegion => electionRegion.sections)
  electionRegion: ElectionRegion;

  @ManyToOne(() => Town, town => town.sections)
  town: Town;

  @ManyToOne(() => CityRegion, cityRegion => cityRegion.sections)
  cityRegion: CityRegion;

  @OneToMany(() => Protocol, protocol => protocol.section)
  protocols: Protocol[];

  @OneToMany(() => Violation, violation => violation.section)
  violations: Violation[];

  stats: StatsDto;
}
