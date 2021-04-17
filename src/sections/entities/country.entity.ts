import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { CityRegion } from '.';
import { Town } from './town.entity';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn()
  public readonly id: number;

  @Column('char', { length: 2 })
  public readonly code: string;

  @Column()
  public readonly name: string;

  @Column()
  public readonly isAbroad: boolean;

  @OneToMany(() => Town, (town) => town.country)
  public readonly towns: Town[];

  sectionsCount: number;

  @ApiProperty({ type: () => CityRegion })
  cityRegions: Record<string, CityRegion> = {};
}
