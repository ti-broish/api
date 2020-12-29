import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryBuilder, Repository, SelectQueryBuilder } from 'typeorm';
import { Town } from './town.entity';

@Injectable()
export class TownsRepository {
  constructor(
    @InjectRepository(Town)
    private repo: Repository<Town>,
  ) {}

  findOne(id: number): Promise<Town> {
    return this.repo.findOne(id);
  }

  findOneOrFail(id: number): Promise<Town> {
    return this.repo.findOneOrFail(id);
  }

  filter(
    countryCode: string,
    electionRegionCode?: string,
    municipalityCode?: string,
  ): Promise<Town[]> {
    const findCriteria = {
      relations: ['cityRegions'],
      join: {
        alias: 'town',
        innerJoin: {
          country: 'town.country',
        },
      },
      where: (qb: SelectQueryBuilder<Town>) => {
        qb.where('country.code = :countryCode', { countryCode });
        if (electionRegionCode) {
          qb.andWhere('electionRegions.code = :electionRegionCode', { electionRegionCode });
          if (municipalityCode) {
            qb.andWhere('municipality.code = :municipalityCode', { municipalityCode });
          }
        }
      }
    };

    if (electionRegionCode) {
      if (municipalityCode) {
        findCriteria.join.innerJoin['municipality'] = 'town.municipality';
      }
      findCriteria.join.innerJoin['electionRegions'] = 'municipality.electionRegions';
    }
    return this.repo.find(findCriteria);
  }
}
