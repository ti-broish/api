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

  findOne(id: string): Promise<Section | undefined> {
    return this.repo.findOne(id);
  }

  findOneOrFail(id: string): Promise<Section> {
    return this.repo.findOneOrFail(id, { relations: ['town'] });
  }

  findOneOrFailWithRelations(id: string): Promise<Section> {
    return this.repo.findOneOrFail(id, {
      relations: ['town', 'town.country', 'electionRegion', 'town.municipality', 'cityRegion']
    });
  }

  findByTownAndCityRegion(townId: number, cityRegionCode?: string): Promise<Section[]> {
    return this.repo.find({
      join: {
        alias: 'section',
        innerJoinAndSelect: {
          town: 'section.town',
        },
      },
      where: (qb: SelectQueryBuilder<Section>): void => {
        qb.where({ town: townId });

        if (cityRegionCode) {
          qb.innerJoinAndSelect('section.cityRegion', 'cityRegion', 'cityRegion.code = :cityRegionCode', { cityRegionCode });
        }
      }
    });
  }

  findByElectionRegion(electionRegion: string): Promise<Section[]> {
    return this.repo.find({ where: { electionRegion } });
  }
}
