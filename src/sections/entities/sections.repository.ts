import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProtocolStatus } from 'src/protocols/entities/protocol.entity';
import { StatsDto } from 'src/results/api/stats.dto';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Section } from './section.entity';
import { TownsRepository } from './towns.repository';

const objectValuesToInt = (
  obj: Record<string, string>,
): Record<string, number> =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, parseInt(value, 10)]),
  );
@Injectable()
export class SectionsRepository {
  constructor(
    @InjectRepository(Section)
    private repo: Repository<Section>,
    @Inject(TownsRepository)
    private readonly townsRepo: TownsRepository,
  ) {}

  getRepo() {
    return this.repo;
  }

  findOne(id: string): Promise<Section | undefined> {
    return this.repo.findOne(id);
  }

  findOneOrFail(id: string): Promise<Section> {
    return this.repo.findOneOrFail(id, { relations: ['town'] });
  }

  findOneOrFailWithRelations(id: string): Promise<Section> {
    return this.repo.findOneOrFail(id, {
      relations: [
        'town',
        'town.country',
        'electionRegion',
        'town.municipality',
        'cityRegion',
      ],
    });
  }

  findByTownAndCityRegion(
    townCode: number,
    cityRegionCode?: string,
  ): Promise<Section[]> {
    return this.repo.find({
      join: {
        alias: 'section',
        innerJoinAndSelect: {
          town: 'section.town',
        },
      },
      where: (qb: SelectQueryBuilder<Section>): void => {
        qb.andWhere('town.code = :townCode', { townCode });

        if (cityRegionCode) {
          qb.innerJoinAndSelect(
            'section.cityRegion',
            'cityRegion',
            'cityRegion.code = :cityRegionCode',
            { cityRegionCode },
          );
        }
      },
    });
  }

  findByElectionRegion(electionRegion: string): Promise<Section[]> {
    return this.repo.find({ where: { electionRegion } });
  }

  async hasPublishedProtocol(section: Section): Promise<boolean> {
    return !!(await this.repo
      .createQueryBuilder('sections')
      .innerJoin('sections.protocols', 'protocols')
      .andWhere('sections.id = :sectionId', { sectionId: section.id })
      .andWhere('protocols.status = :published', {
        published: ProtocolStatus.PUBLISHED,
      })
      .limit(1)
      .getOne());
  }

  async getResultsFor(
    segment = '',
    groupBySegment = 0,
  ): Promise<number[] | Record<string, number[]>> {
    const qb = this.repo.createQueryBuilder('sections').select([]);
    qb.addSelect('results.party_id', 'party_id');
    qb.addSelect('SUM(results.validVotesCount)', 'validVotesCount');
    if (segment.length > 0) {
      qb.andWhere('sections.id like :segment', { segment: `${segment}%` });
    }
    qb.innerJoin('sections.protocols', 'protocols');
    qb.innerJoin('protocols.results', 'results');
    qb.andWhere('protocols.status = :published', {
      published: ProtocolStatus.PUBLISHED,
    });
    if (groupBySegment > 0) {
      qb.addSelect('MAX(LEFT(sections.id, :groupBySegment))', 'segment')
        .groupBy('LEFT(sections.id, :groupBySegment)')
        .setParameters({ groupBySegment });
    }
    qb.addGroupBy('results.party_id');

    const rawResults = await qb.getRawMany();
    if (groupBySegment === 0) {
      return rawResults.reduce(
        (acc, { party_id, validVotesCount }) =>
          acc.concat([party_id, parseInt(validVotesCount, 10)]),
        [],
      );
    }

    return rawResults.reduce((acc, result) => {
      acc[result.segment] = (acc[result.segment] || []).concat([
        result.party_id,
        parseInt(result.validVotesCount, 10),
      ]);
      return acc;
    }, {});
  }

  async getStatsFor(
    segment = '',
    groupBySegment = 0,
  ): Promise<StatsDto | Record<string, StatsDto>[]> {
    const statsQueries = [
      this.qbStats(segment, groupBySegment).addSelect(
        'SUM(sections.voters_count)',
        'voters',
      ),
      this.qbStats(segment, groupBySegment)
        .addSelect('COUNT(distinct sections.id)', 'sectionsWithResults')
        .addSelect('COALESCE(SUM(results.validVotesCount), 0)', 'validVotes')
        .addSelect(
          "COALESCE(SUM((protocols.metadata->'invalidVotesCount')::int), 0)",
          'invalidVotes',
        )
        .innerJoin(
          'sections.protocols',
          'protocols',
          'protocols.status = :published',
          { published: ProtocolStatus.PUBLISHED },
        )
        .innerJoin('protocols.results', 'results'),
      this.qbStats(segment, groupBySegment)
        .addSelect('COUNT(violations.id)', 'violationsCount')
        .innerJoin('sections.violations', 'violations'),
      this.qbStats(segment, groupBySegment).addSelect(
        'COUNT(sections.id)',
        'sectionsCount',
      ),
      this.qbStats(segment, groupBySegment)
        .addSelect('COUNT(violations.id)', 'processedViolations')
        .innerJoin('sections.violations', 'violations')
        .andWhere("violations.status = 'processed'"),
      this.qbStats(segment, groupBySegment)
        .addSelect('COUNT(violations.id)', 'publishedViolations')
        .innerJoin('sections.violations', 'violations')
        .andWhere('violations.isPublished = TRUE'),
      this.qbStats(segment, groupBySegment)
        .addSelect('COUNT(streams.id)', 'streamsCount')
        .innerJoin('sections.streams', 'streams')
        .innerJoin('streams.chunks', 'chunks'),
      this.qbStats(segment, groupBySegment)
        .addSelect('COUNT(streams.id)', 'streamsCountActive')
        .innerJoin('sections.streams', 'streams')
        .andWhere('streams.isStreaming = TRUE'),
    ];

    const statsQueriesTown = [
      this.qbStatsTownViolations(segment, groupBySegment).addSelect(
        'COUNT(*)',
        'violationsCountTown',
      ),
    ];
    segment.length == 9 ? statsQueriesTown.pop() : statsQueriesTown;
    const rawResults =
      groupBySegment > 0
        ? statsQueries.map((sqb) =>
            sqb
              .groupBy('LEFT(sections.id, :groupBySegment)')
              .setParameters({ groupBySegment })
              .getRawMany(),
          )
        : statsQueries.map((sqb) => sqb.getRawOne());
    const rawResultsTown =
      groupBySegment > 0
        ? statsQueriesTown.map((sqb) => sqb.getRawMany())
        : statsQueriesTown.map((sqb) => sqb.getRawOne());
    const statsSections = await Promise.all(rawResults);
    const statsTown = await Promise.all(rawResultsTown);
    const stats = statsSections.concat(statsTown);
    let violationsCountTown = 0;
    stats.forEach((x) =>
      Object.keys(x).includes('violationsCountTown')
        ? (violationsCountTown = parseInt(x.violationsCountTown))
        : (violationsCountTown = 0),
    );
    stats.forEach((x) =>
      Object.keys(x).includes('violationsCount')
        ? (x.violationsCount =
            parseInt(x.violationsCount) + violationsCountTown)
        : x.violatinsCount,
    );

    if (groupBySegment > 0) {
      const output = {};

      stats
        .filter((x) => x.length > 0)
        .forEach((stat) => {
          stat.forEach((singleStat) => {
            if (!output[singleStat.segment]) {
              output[singleStat.segment] = new StatsDto();
            }
            Object.keys(singleStat).forEach((key) => {
              output[singleStat.segment][key] = parseInt(singleStat[key], 10);
              Object.keys(output[singleStat.segment]).includes(
                'violationsCountTown',
              )
                ? (output[singleStat.segment].violationsCount =
                    parseInt(output[singleStat.segment].violationsCount) +
                    output[singleStat.segment].violationsCountTown)
                : output[singleStat.segment].violationsCount;
            });
            delete singleStat.segment;
          });
        });

      return output;
    }

    return objectValuesToInt(
      stats.reduce((acc, x) => Object.assign(acc, x), {} as StatsDto),
    );
  }

  private qbStats(
    segment: string,
    groupBySegment = 0,
  ): SelectQueryBuilder<Section> {
    const qb = this.repo.createQueryBuilder('sections').select([]);
    this.qbStatsWithQueryBuilder(segment, groupBySegment, qb);

    return qb;
  }

  private qbStatsWithQueryBuilder(
    segment: string,
    groupBySegment = 0,
    qb: SelectQueryBuilder<Section>,
  ): SelectQueryBuilder<Section> {
    if (segment.length > 0) {
      qb.where('sections.id like :segment', { segment: `${segment}%` });
    }
    if (groupBySegment > 0) {
      qb.addSelect(
        'MAX(LEFT(sections.id, :groupBySegment))',
        'segment',
      ).setParameters({ groupBySegment });
    }

    return qb;
  }

  private qbStatsTownViolations(
    segment: string,
    groupBySegment = 0,
  ): SelectQueryBuilder<Section> {
    const qb = this.repo.manager.createQueryBuilder().select([]);
    qb.from((subQuery) => {
      return this.qbStatsWithQueryBuilder(segment, groupBySegment, subQuery)
        .from('sections', 'sections')
        .addSelect('sections.town_id')
        .groupBy('sections.town_id');
    }, 'sections')
      .innerJoin(
        'violations',
        'violations',
        '"violations"."town_id" = "sections"."town_id"',
      )
      .andWhere('violations.section_id IS NULL');
    if (groupBySegment > 0) {
      qb.groupBy('sections.segment');
      qb.addSelect('segment');
    }

    return qb;
  }
}
