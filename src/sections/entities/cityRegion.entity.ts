import { Entity, Column, PrimaryColumn, OneToMany, ManyToMany } from 'typeorm'
import { Section } from './section.entity'
import { Town } from './town.entity'
import { WithCode } from './withCode.interface'

@Entity('city_regions')
export class CityRegion implements WithCode {
  @PrimaryColumn()
  id: number

  @Column('char', { length: 2 })
  code: string

  @Column()
  name: string

  @ManyToMany(() => Town, (town) => town.cityRegions)
  towns: Town[]

  @OneToMany(() => Section, (section) => section.cityRegion)
  sections: Section[]

  constructor(name: string, code: string, towns: Town[]) {
    this.name = name
    this.code = code
    this.towns = towns
  }
}
