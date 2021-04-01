import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElectionRegion } from './electionRegion.entity';

@Injectable()
export class ElectionRegionsRepository {
  constructor(@InjectRepository(ElectionRegion) private repo: Repository<ElectionRegion>) {}

  async findOneOrFail(code: string): Promise<ElectionRegion> {
    return this.repo.findOneOrFail({ where: { code } });
  }

  async findOneWithStatsOrFail(code: string): Promise<ElectionRegion> {
    const qb = this.repo.createQueryBuilder('electionRegions');

    qb.innerJoin('electionRegions.sections', 'sections');
    qb.loadRelationCountAndMap('electionRegions.sectionsCount', 'electionRegions.sections');
    qb.whereInIds([code]);
    qb.groupBy('electionRegions.id');

    return qb.getOneOrFail();
  }

  findAll(): Promise<ElectionRegion[]> {
    return this.repo.find();
  }

  findAllWithStats(): Promise<ElectionRegion[]> {
    const qb = this.repo.createQueryBuilder('electionRegions');

    qb.innerJoin('electionRegions.sections', 'sections');
    qb.loadRelationCountAndMap('electionRegions.sectionsCount', 'electionRegions.sections');
    qb.groupBy('electionRegions.id');

    return qb.getMany();
  }

  findAllWithMunicipalities(): Promise<ElectionRegion[]> {
    return this.repo.find({ relations: ['municipalities' ]});
  }
}
