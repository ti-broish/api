import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Town } from './town.entity'

@Injectable()
export class TownsRepository {
  constructor(
    @InjectRepository(Town)
    private repo: Repository<Town>,
  ) {}

  getRepo(): Repository<Town> {
    return this.repo
  }

  findOneByCode(code: number): Promise<Town> {
    return this.repo.findOneBy({ code })
  }

  findOneByCodeOrFail(code: number): Promise<Town> {
    return this.repo.findOneByOrFail({ code })
  }

  filter(
    countryCode: string,
    electionRegionCode?: string,
    municipalityCode?: string,
  ): Promise<Town[]> {
    if (electionRegionCode && !municipalityCode) {
      throw new Error('Cannot filter towns by just election region!')
    }

    const qb = this.repo.createQueryBuilder('town')
    qb.innerJoin('town.country', 'country')
    qb.andWhere('country.code = :countryCode', { countryCode })

    if (electionRegionCode && municipalityCode) {
      qb.innerJoin(
        'town.municipality',
        'municipality',
        'municipality.code = :municipalityCode',
        { municipalityCode },
      )
      qb.innerJoin(
        'municipality.electionRegions',
        'electionRegions',
        'electionRegions.code = :electionRegionCode',
        { electionRegionCode },
      )
      qb.innerJoin(
        'town.sections',
        'section',
        'section.election_region_id = electionRegions.id',
      )
      qb.leftJoinAndSelect(
        'town.cityRegions',
        'city_region',
        'city_region.id = "section"."city_region_id"',
      )
    }

    return qb.getMany()
  }
}
