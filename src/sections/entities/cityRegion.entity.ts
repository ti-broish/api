import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany } from 'typeorm';
import { Section } from './section.entity';
import { Town } from './town.entity';

@Entity('city_regions')
export class CityRegion {
  @PrimaryColumn()
  id: number;

  @Column('char', { length: 2 })
  code: string;

  @Column()
  name: string;

  @ManyToOne(() => Town, town => town.cityRegions)
  town: Town;

  @OneToMany(() => Section, section => section.cityRegion)
  sections: Section[];
}
