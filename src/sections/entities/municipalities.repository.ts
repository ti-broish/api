import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CityRegion } from './cityRegion.entity';
import { ElectionRegion } from './electionRegion.entity';
import { Municipality } from './municipality.entity';
import { Town } from './town.entity';

@Injectable()
export class MunicipalitiesRepository {
  constructor(@InjectRepository(Municipality) private repo: Repository<Municipality>) {}

  async findOneWithStatsOrFail(electionRegion: ElectionRegion, code: string): Promise<Municipality> {
    const municipality = await this.repo.createQueryBuilder('municipalities')
      .innerJoin('municipalities.electionRegions', 'electionRegions')
      .innerJoinAndSelect('municipalities.towns', 'towns')
      .innerJoinAndSelect('towns.sections', 'sections')
      .leftJoinAndSelect('towns.cityRegions', 'cityRegions')
      .leftJoin('cityRegions.sections', 'cityRegionSections')
      .loadRelationCountAndMap('sectons.sectionsCount', 'municipalities.towns')
      .andWhere('electionRegions.id = :electionRegionId', { electionRegionId: electionRegion.id })
      .andWhere('municipalities.code = :code', { code })
      .andWhere(new Brackets(qba => {
        qba.andWhere('cityRegionSections.election_region_id = :electionRegionId', { electionRegionId: electionRegion.id });
        qba.orWhere('cityRegionSections.id is null');
      }))
      .getOneOrFail();

    municipality.cityRegions = municipality.towns.reduce((acc: Record<string, CityRegion>, town: Town) => {
      town.cityRegions.forEach((cityRegion: CityRegion) => {
        if (!acc[cityRegion.code]) {
          acc[cityRegion.code] = cityRegion;
        }
        if (!acc[cityRegion.code].towns) {
          acc[cityRegion.code].towns = [];
        }
        acc[cityRegion.code].towns.push(town);
      });
      delete town.cityRegions;
      return acc;
    }, {});

    return municipality;
  }

  async findFromElectionRegionWithCityRegionsAndStats(electionRegionId: number): Promise<Municipality[]> {
    const qb = this.repo.createQueryBuilder('municipalities');

    qb.innerJoinAndSelect('municipalities.towns', 'towns');
    qb.leftJoinAndSelect('towns.cityRegions', 'cityRegions');
    qb.leftJoin('cityRegions.sections', 'sections');
    qb.innerJoin('municipalities.electionRegions', 'electionRegions');
    qb.andWhere('electionRegions.id = :electionRegionId', { electionRegionId });
    qb.andWhere(new Brackets(qba => {
      qba.andWhere('sections.election_region_id = :electionRegionId', { electionRegionId });
      qba.orWhere('sections.election_region_id is null');
    }));

    const municipalities = await qb.getMany();

    return municipalities.map((municipality: Municipality): Municipality => {
      municipality.cityRegions = municipality.towns.reduce((acc: Record<string, CityRegion>, town: Town) => {
        town.cityRegions.forEach((cityRegion: CityRegion) => {
          if (!acc[cityRegion.code]) {
            acc[cityRegion.code] = cityRegion;
          }
          if (!acc[cityRegion.code].towns) {
            acc[cityRegion.code].towns = [];
          }
          acc[cityRegion.code].towns.push(town);
        });
        delete town.cityRegions;
        return acc;
      }, {});

      return municipality;
    });
  }
}
