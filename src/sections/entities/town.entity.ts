import { Violation } from '../../violations/entities/violation.entity';
import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { CityRegion } from './cityRegion.entity';
import { Country } from './country.entity';
import { Municipality } from './municipality.entity';
import { Section } from './section.entity';

@Entity('towns')
export class Town {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column()
  code: number;

  @Column()
  readonly name: string;

  @ManyToOne(() => Country, (country) => country.towns)
  readonly country: Country;

  @ManyToOne(() => Municipality, (municipality) => municipality.towns)
  readonly municipality: Municipality;

  @ManyToMany(() => CityRegion, (cityRegion) => cityRegion.towns)
  @JoinTable({
    name: 'city_regions_towns',
    joinColumn: { name: 'town_id' },
    inverseJoinColumn: { name: 'city_region_id' },
  })
  cityRegions: CityRegion[];

  @OneToMany(() => Section, (section) => section.town)
  readonly sections: Section[];

  @OneToMany(() => Violation, (violation) => violation.town)
  readonly violations: Violation[];
}
