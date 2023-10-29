import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { COUNTRY_DOMESTIC } from '../sections.constants'
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

    if (countryCode === '00' || countryCode === '000') {
      countryCode = COUNTRY_DOMESTIC
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
      qb.innerJoinAndSelect(
        'town.sections',
        'section',
        'section.election_region_id = electionRegions.id',
      )
      qb.leftJoinAndSelect(
        'town.cityRegions',
        'city_region',
        'city_region.id = "section"."city_region_id"',
      )
    } else {
      qb.innerJoinAndSelect('town.sections', 'sections')
    }

    return qb.getMany()
  }

  findByCityRegion(cityRegionId: number): Promise<Town[]> {
    const qb = this.repo.createQueryBuilder('town')
    qb.innerJoin('town.cityRegions', 'cityRegion')
    qb.innerJoinAndSelect('town.sections', 'sections')
    qb.andWhere('cityRegion.id = :cityRegionId', { cityRegionId })
    qb.andWhere('sections.city_region_id = :cityRegionId', { cityRegionId })
    return qb.getMany()
  }

  findByMunicipality(municipalityId: number): Promise<Town[]> {
    const qb = this.repo.createQueryBuilder('town')
    qb.innerJoin('town.municipality', 'municipality')
    qb.innerJoinAndSelect('town.sections', 'sections')
    qb.andWhere('municipality.id = :municipalityId', { municipalityId })
    return qb.getMany()
  }
}
