import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CityRegion } from './cityRegion.entity';
import { ElectionRegion } from './electionRegion.entity';

@Injectable()
export class CityRegionsRepository {
  constructor(
    @InjectRepository(CityRegion) private repo: Repository<CityRegion>,
  ) {}

  findOneOrFail(
    electionRegion: ElectionRegion,
    code: string,
  ): Promise<CityRegion> {
    return this.repo
      .createQueryBuilder('cityRegion')
      .innerJoinAndSelect('cityRegion.sections', 'sections')
      .innerJoinAndSelect('cityRegion.towns', 'towns')
      .innerJoinAndSelect(
        'towns.sections',
        'townSections',
        'townSections.city_region_id = cityRegion.id',
      )
      .andWhere('cityRegion.code = :code', { code })
      .andWhere('sections.election_region_id = :electionRegionId', {
        electionRegionId: electionRegion.id,
      })
      .getOneOrFail();
  }
}
