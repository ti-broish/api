import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { Town } from './town.entity'
import { WithCode } from './withCode.interface'

@Entity('countries')
export class Country implements WithCode {
  @PrimaryGeneratedColumn()
  public readonly id: number

  @Column('char', { length: 2 })
  public readonly code: string

  @Column()
  public readonly name: string

  @Column()
  public readonly isAbroad: boolean

  @OneToMany(() => Town, (town) => town.country)
  public readonly towns: Town[]

  sectionsCount: number
}
