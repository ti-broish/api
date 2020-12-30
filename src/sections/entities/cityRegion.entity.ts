import { Entity, Column, PrimaryColumn, OneToMany, ManyToMany } from 'typeorm';
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

  @ManyToMany(() => Town, town => town.cityRegions)
  towns: Town[];

  @OneToMany(() => Section, section => section.cityRegion)
  sections: Section[];
}
