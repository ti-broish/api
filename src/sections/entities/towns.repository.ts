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
    if (electionRegionCode && !municipalityCode) {
      throw new Error('Cannot filter towns by just election region!');
    }

    return this.repo.find({
      join: {
        alias: 'town',
        innerJoin: {
          country: 'town.country',
        },
      },
      where: (qb: SelectQueryBuilder<Town>) => {
        qb.where('country.code = :countryCode', { countryCode });

        if (electionRegionCode && municipalityCode) {
          qb.innerJoin(
            'town.municipality',
            'municipality',
            'municipality.code = :municipalityCode',
            { municipalityCode },
          );
          qb.innerJoin(
            'municipality.electionRegions',
            'electionRegions',
            'electionRegions.code = :electionRegionCode',
            { electionRegionCode },
          );
          qb.innerJoin(
            'town.sections',
            'section',
            'section.election_region_id = electionRegions.id',
          );
          qb.leftJoinAndSelect(
            'town.cityRegions',
            'city_region',
            'city_region.id = "section"."city_region_id"',
          );
        }
      },
    });
  }
}
