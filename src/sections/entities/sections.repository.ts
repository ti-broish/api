import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryBuilder, Repository, SelectQueryBuilder } from 'typeorm';
import { Section } from './section.entity';

@Injectable()
export class SectionsRepository {
  constructor(
    @InjectRepository(Section)
    private repo: Repository<Section>,
  ) {}

  findOneOrFail(id: string): Promise<Section> {
    return this.repo.findOneOrFail(id);
  }

  findByCityRegion(townId: number, cityRegionCode: string): Promise<Section[]> {
    return this.repo.find({
      join: {
        alias: 'section',
        innerJoinAndSelect: {
          town: 'section.town',
          cityRegion: 'section.cityRegion',
        },
      },
      where: (qb: SelectQueryBuilder<Section>) => {
        qb
          .where({town: townId })
          .andWhere('cityRegion.code = :cityRegionCode', { cityRegionCode });
      }
    });
  }

  findByTown(townId: number): Promise<Section[]> {
    return this.repo.find({
      join: {
        alias: 'section',
        innerJoinAndSelect: {
          town: 'section.town',
        },
        leftJoinAndSelect: {
          cityRegion: 'section.cityRegion',
        }
      },
      where: {town: townId },
    });
  }

  findByElectionRegion(electionRegion: string): Promise<Section[]> {
    return this.repo.find({  where: { electionRegion } });
  }
}
