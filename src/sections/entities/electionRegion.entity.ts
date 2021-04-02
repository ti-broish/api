import { StatsDto } from 'src/results/api/stats.dto';
import { Entity, Column, OneToMany, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { Country } from './country.entity';
import { Municipality } from './municipality.entity';
import { Section } from './section.entity';

@Entity('election_regions')
export class ElectionRegion {
  @PrimaryGeneratedColumn()
  public readonly id: number;

  @Column('char', { length: 2 })
  public readonly code: string;

  @Column()
  public readonly name: string;

  @Column()
  public readonly isAbroad: boolean;

  @OneToMany(() => Section, section => section.electionRegion)
  public readonly sections: Section[];

  sectionsCount: number;
  voters: number;

  countries: Country[];

  stats: StatsDto;

  admUnits: Array<Municipality | Country>;

  @ManyToMany(() => Municipality, municipality => municipality.electionRegions)
  @JoinTable({
    name: 'election_regions_municipalities',
    joinColumns: [{ name: 'election_region_id' }],
    inverseJoinColumns: [{ name: 'municipality_id' }],
  })
  public municipalities: Municipality[];
}
