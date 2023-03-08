import { ApiProperty } from '@nestjs/swagger'
import { Entity, Column, PrimaryColumn, OneToMany, ManyToMany } from 'typeorm'
import { CityRegion } from './cityRegion.entity'
import { ElectionRegion } from './electionRegion.entity'
import { Town } from './town.entity'
import { WithCode } from './withCode.interface'

@Entity('municipalities')
export class Municipality implements WithCode {
  @PrimaryColumn()
  readonly id: number

  @Column('char', { length: 2 })
  readonly code: string

  @Column()
  readonly name: string

  @ManyToMany(
    () => ElectionRegion,
    (electionRegion) => electionRegion.municipalities,
  )
  readonly electionRegions: ElectionRegion[]

  @OneToMany(() => Town, (town) => town.municipality)
  readonly towns: Town[]

  sectionsCount: number

  @ApiProperty({ type: () => CityRegion })
  cityRegions: Record<string, CityRegion> = {}

  public isMunicipalityHidden(): boolean {
    return (
      (this.towns.length === 1 && this.towns[0].cityRegions.length > 0) ||
      this.electionRegions.length > 1
    )
  }
}
