import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository } from 'typeorm'
import { ElectionRegion } from './electionRegion.entity'
import { Municipality } from './municipality.entity'

@Injectable()
export class MunicipalitiesRepository {
  constructor(
    @InjectRepository(Municipality) private repo: Repository<Municipality>,
  ) {}

  async findOneOrFail(
    electionRegion: ElectionRegion,
    code: string,
  ): Promise<Municipality> {
    return this.repo
      .createQueryBuilder('municipality')
      .innerJoin('municipality.electionRegions', 'electionRegion')
      .innerJoinAndSelect('municipality.towns', 'towns')
      .leftJoinAndSelect('towns.cityRegions', 'cityRegions')
      .andWhere('electionRegion.id = :electionRegionId', {
        electionRegionId: electionRegion.id,
      })
      .andWhere('municipality.code = :code', { code })
      .getOneOrFail()
  }

  async findFromElectionRegionWithCityRegionsAndStats(
    electionRegionId: number,
  ): Promise<Municipality[]> {
    const qb = this.repo.createQueryBuilder('municipalities')

    qb.innerJoinAndSelect('municipalities.towns', 'towns')
    qb.leftJoinAndSelect('towns.cityRegions', 'cityRegions')
    qb.leftJoin('cityRegions.sections', 'sections')
    qb.innerJoin('municipalities.electionRegions', 'electionRegion')
    qb.andWhere('electionRegion.id = :electionRegionId', { electionRegionId })
    qb.andWhere(
      new Brackets((qba) => {
        qba.andWhere('sections.election_region_id = :electionRegionId', {
          electionRegionId,
        })
        qba.orWhere('sections.election_region_id is null')
      }),
    )

    return qb.getMany()
  }
}
