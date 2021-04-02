import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StatsDto } from 'src/results/api/stats.dto';
import { EntityManager, Repository } from 'typeorm';
import { ElectionRegion } from './electionRegion.entity';

@Injectable()
export class ElectionRegionsRepository {
  constructor(
    @InjectRepository(ElectionRegion) private repo: Repository<ElectionRegion>,
    private entityManager: EntityManager,
  ) {}

  async findOneOrFail(code: string): Promise<ElectionRegion> {
    return this.repo.findOneOrFail({ where: { code } });
  }

  async findOneWithStatsOrFail(code: string): Promise<ElectionRegion> {
    const electionRegion = this.repo.createQueryBuilder('electionRegions')
      .innerJoin('electionRegions.sections', 'sections')
      .whereInIds([code])
      .groupBy('electionRegions.id')
      .getOneOrFail();

    const stats = this.entityManager.createQueryBuilder(this.repo.queryRunner)
      .addSelect('sum(sections.voters_count)', 'voters')
      .addSelect('count(sections.id)', 'sectionsCount')
      .from('sections', 'sections')
      .andWhere('sections.election_region_id = :code', { code })
      .groupBy('sections.election_region_id')
      .getRawOne();

    const [electionRegionResult, statsResult] = await Promise.all([electionRegion, stats]);
    electionRegionResult.stats = Object.fromEntries((Object.entries(statsResult).map(([key, value]: [string, string]) => [key, parseInt(value, 10)])));

    return electionRegionResult;
  }

  async findOneWithMunicipalitiesOrFail(code: string): Promise<ElectionRegion> {
    const qb = this.repo.createQueryBuilder('electionRegions');

    qb.innerJoinAndSelect('electionRegions.municipalities', 'municipalities');
    qb.whereInIds([code]);

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
