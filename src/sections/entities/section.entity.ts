import { Entity, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { CityRegion } from './cityRegion.entity';
import { ElectionRegion } from './electionRegion.entity';
import { Town } from './town.entity';

@Entity('sections')
export class Section {
  @PrimaryColumn('char', { length: 9 })
  id: string;

  @Column('char', { length: 3 })
  code: string;

  @Column()
  place: string;

  @Column()
  votersCount: number;

  @ManyToOne(() => ElectionRegion, electionRegion => electionRegion.sections)
  electionRegion: ElectionRegion;

  @ManyToOne(() => Town, town => town.sections)
  town: Town;

  @ManyToOne(() => CityRegion, cityRegion => cityRegion.sections)
  cityRegion: CityRegion;
}
