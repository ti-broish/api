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

  findByCountry(countryCode: string): Promise<Town[]> {
    return this.repo.find({
      relations: ['cityRegions'],
      join: {
        alias: 'town',
        innerJoin: {
          country: 'town.country',
        },
      },
      where: (qb: SelectQueryBuilder<Town>) => {
        qb.where('country.code = :countryCode', { countryCode });
      }
    });
  }

  findByMunicipality(electionRegionCode: string, municipalityCode: string): Promise<Town[]> {
    return this.repo.find({
      relations: ['cityRegions'],
      join: {
        alias: 'town',
        innerJoin: {
          municipality: 'town.municipality',
          electionRegions: 'municipality.electionRegions',
        },
      },
      where: (qb: SelectQueryBuilder<Town>) => {
        qb
          .where('municipality.code = :municipalityCode', { municipalityCode })
          .andWhere('electionRegions.code = :electionRegionCode', { electionRegionCode });
      }
    });

  }
}
