import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ProtocolStatus } from 'src/protocols/entities/protocol.entity'
import { StatsDto } from 'src/results/api/stats.dto'
import {
  EntityNotFoundError,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm'
import { CITY_REGION_NONE, ELECTION_REGION_ABROAD } from '../sections.constants'
import { Section } from './section.entity'
import { TownsRepository } from './towns.repository'

const objectValuesToInt = (
  obj: Record<string, string>,
): Record<string, number> =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, parseInt(value, 10)]),
  )
@Injectable()
export class SectionsRepository {
  constructor(
    @InjectRepository(Section)
    private repo: Repository<Section>,
    @Inject(TownsRepository)
    private readonly townsRepo: TownsRepository,
  ) {}

  getRepo() {
    return this.repo
  }

  findOne(id: string): Promise<Section | undefined> {
    return this.repo.findOneBy({ id })
  }

  findOneOrFail(id: string): Promise<Section> {
    if (!id.match(/^\d{9}$/)) {
      throw new EntityNotFoundError(Section, { id })
    }

    const qb = this.joinRelationsBasedOnSegments(id)

    qb.where('sections.id = :id', { id })

    return qb.getOneOrFail()
  }

  findOneByPartialIdOrFail(id: string): Promise<Section> {
    if (!id.match(/^\d{2}(\d{2}(\d{2}(\d{3})?)?)?$/)) {
      throw new EntityNotFoundError(Section, { id })
    }

    const qb = this.joinRelationsBasedOnSegments(id)

    qb.where('sections.id like :id', { id: `${id}%` })

    return qb.getOneOrFail()
  }

  private joinRelationsBasedOnSegments(
    segment: string,
  ): SelectQueryBuilder<Section> {
    const [electionRegionCode, , cityRegionCode] = segment
      .split(/^(\d{2})(\d{2})?(\d{2})?(\d{3})?$/)
      .filter((x) => !!x)

    const qb = this.repo.createQueryBuilder('sections')

    qb.innerJoinAndSelect('sections.electionRegion', 'electionRegion')
    qb.innerJoinAndSelect('sections.town', 'town')
    qb.innerJoinAndSelect('town.country', 'country')
    if (electionRegionCode !== ELECTION_REGION_ABROAD) {
      qb.innerJoinAndSelect('town.municipality', 'municipality')
      if (cityRegionCode && cityRegionCode !== CITY_REGION_NONE) {
        qb.innerJoinAndSelect('sections.cityRegion', 'cityRegion')
      }
    }

    return qb
  }

  findByTownAndCityRegion(
    townCode: number,
    cityRegionCode?: string,
  ): Promise<Section[]> {
    const qb = this.repo.createQueryBuilder('sections')
    qb.innerJoinAndSelect('sections.town', 'town', 'town.code = :townCode', {
      townCode,
    })

    if (cityRegionCode) {
      qb.innerJoinAndSelect(
        'sections.cityRegion',
        'cityRegion',
        'cityRegion.code = :cityRegionCode',
        { cityRegionCode },
      )
    }

    return qb.getMany()
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
      .getOne())
  }

  async getResultsFor(
    segment = '',
    groupBySegment = 0,
  ): Promise<number[] | Record<string, number[]>> {
    if (groupBySegment > 0) {
      return {}
    }
    return []
    const qb = this.repo.createQueryBuilder('sections').select([])
    qb.addSelect('results.party_id', 'party_id')
    qb.addSelect('SUM(results.validVotesCount)', 'validVotesCount')
    if (segment.length > 0) {
      qb.andWhere('sections.id like :segment', { segment: `${segment}%` })
    }
    qb.innerJoin('sections.protocols', 'protocols')
    qb.innerJoin('protocols.results', 'results')
    qb.andWhere('protocols.status = :published', {
      published: ProtocolStatus.PUBLISHED,
    })
    if (groupBySegment > 0) {
      qb.addSelect('MAX(LEFT(sections.id, :groupBySegment))', 'segment')
        .groupBy('LEFT(sections.id, :groupBySegment)')
        .setParameters({ groupBySegment })
    }
    qb.addGroupBy('results.party_id')

    const rawResults = await qb.getRawMany()
    if (groupBySegment === 0) {
      return rawResults.reduce(
        (acc, { party_id, validVotesCount }) =>
          acc.concat([party_id, parseInt(validVotesCount, 10)]),
        [],
      )
    }

    return rawResults.reduce((acc, result) => {
      acc[result.segment] = (acc[result.segment] || []).concat([
        result.party_id,
        parseInt(result.validVotesCount, 10),
      ])
      return acc
    }, {})
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
        .addSelect('COUNT(distinct streams.id)', 'streamsCount')
        .innerJoin('sections.streams', 'streams')
        .innerJoin('streams.chunks', 'chunks'),
      this.qbStats(segment, groupBySegment)
        .addSelect('COUNT(streams.id)', 'streamsCountActive')
        .innerJoin('sections.streams', 'streams')
        .andWhere('streams.isStreaming = TRUE'),
      this.qbStats(segment, groupBySegment)
        .addSelect('COUNT(sections.id)', 'highRisk')
        .andWhere("sections.riskLevel = 'high'"),
      this.qbStats(segment, groupBySegment)
        .addSelect('COUNT(sections.id)', 'midRisk')
        .andWhere("sections.riskLevel = 'mid'"),
      this.qbStats(segment, groupBySegment).addSelect(
        'SUM(sections.population)',
        'population',
      ),
      this.qbStats(segment, groupBySegment)
        .addSelect('COUNT(sections.id)', 'populated')
        .andWhere('sections.population > 0'),
    ]

    const statsQueriesTown = [
      this.qbStatsTownViolations(segment, groupBySegment).addSelect(
        'COUNT(*)',
        'violationsCountTown',
      ),
    ]
    segment.length == 9 ? statsQueriesTown.pop() : statsQueriesTown
    const rawResults =
      groupBySegment > 0
        ? statsQueries.map((sqb) =>
            sqb
              .groupBy('LEFT(sections.id, :groupBySegment)')
              .setParameters({ groupBySegment })
              .getRawMany(),
          )
        : statsQueries.map((sqb) => sqb.getRawOne())
    const rawResultsTown =
      groupBySegment > 0
        ? statsQueriesTown.map((sqb) => sqb.getRawMany())
        : statsQueriesTown.map((sqb) => sqb.getRawOne())
    const statsSections = await Promise.all(rawResults)
    const statsTown = await Promise.all(rawResultsTown)
    const stats = statsSections.concat(statsTown)
    let violationsCountTown = 0
    stats.forEach((x) =>
      Object.keys(x).includes('violationsCountTown')
        ? (violationsCountTown = parseInt(x.violationsCountTown, 10))
        : (violationsCountTown = 0),
    )
    stats.forEach((x) =>
      Object.keys(x).includes('violationsCount')
        ? (x.violationsCount =
            parseInt(x.violationsCount, 10) + violationsCountTown)
        : x.violatinsCount,
    )

    if (groupBySegment > 0) {
      const output = {}

      stats
        .filter((x) => x.length > 0)
        .forEach((stat) => {
          stat.forEach((singleStat) => {
            if (!output[singleStat.segment]) {
              output[singleStat.segment] = new StatsDto()
            }
            Object.keys(singleStat).forEach((key) => {
              output[singleStat.segment][key] = parseInt(singleStat[key], 10)
              Object.keys(output[singleStat.segment]).includes(
                'violationsCountTown',
              )
                ? (output[singleStat.segment].violationsCount =
                    parseInt(output[singleStat.segment].violationsCount, 10) +
                    parseInt(
                      output[singleStat.segment].violationsCountTown,
                      10,
                    ))
                : parseInt(output[singleStat.segment].violationsCount, 10)
            })
            delete singleStat.segment
          })
        })

      return output
    }

    return objectValuesToInt(
      stats.reduce((acc, x) => Object.assign(acc, x), {} as StatsDto),
    )
  }

  private qbStats(
    segment: string,
    groupBySegment = 0,
  ): SelectQueryBuilder<Section> {
    const qb = this.repo.createQueryBuilder('sections').select([])
    this.qbStatsWithQueryBuilder(segment, groupBySegment, qb)

    return qb
  }

  private qbStatsWithQueryBuilder(
    segment: string,
    groupBySegment = 0,
    qb: SelectQueryBuilder<Section>,
  ): SelectQueryBuilder<Section> {
    if (segment.length > 0) {
      qb.where('sections.id like :segment', { segment: `${segment}%` })
    }
    if (groupBySegment > 0) {
      qb.addSelect(
        'MAX(LEFT(sections.id, :groupBySegment))',
        'segment',
      ).setParameters({ groupBySegment })
    }

    return qb
  }

  private qbStatsTownViolations(
    segment: string,
    groupBySegment = 0,
  ): SelectQueryBuilder<Section> {
    const qb = this.repo.manager.createQueryBuilder().select([])
    qb.from((subQuery) => {
      return this.qbStatsWithQueryBuilder(segment, groupBySegment, subQuery)
        .from('sections', 'sections')
        .addSelect('sections.town_id')
        .groupBy('sections.town_id')
    }, 'sections')
      .innerJoin(
        'violations',
        'violations',
        '"violations"."town_id" = "sections"."town_id"',
      )
      .andWhere('violations.section_id IS NULL')
    if (groupBySegment > 0) {
      qb.groupBy('sections.segment')
      qb.addSelect('segment')
    }

    return qb
  }

  async updatePopulation(sections: Map<string, number>): Promise<void> {
    const sectionIds = Array.from(sections.keys())
    const queryRunner = this.repo.manager.connection.createQueryRunner()

    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      // Find all existing sections by primary key
      const existingSections = await queryRunner.manager.find<Section>(
        Section,
        {
          where: { id: In(sectionIds) },
          lock: { mode: 'pessimistic_write' },
        },
      )

      // Validate that all section ids in CSV exist in the database
      const existingSectionIds = existingSections.map((section) => section.id)
      const invalidSectionIds = sectionIds.filter(
        (id: string) => !existingSectionIds.includes(id),
      )
      if (invalidSectionIds.length > 0) {
        throw new RangeError(
          `Invalid section ids: ${invalidSectionIds.join(', ')}`,
        )
      }

      // Update population column in section entities
      existingSections.forEach((existingSection: Section) => {
        existingSection.population = sections.get(existingSection.id)
      })

      // Save updated section entities in a single batch
      await queryRunner.manager.save(existingSections)
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }
}
