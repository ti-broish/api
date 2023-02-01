import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, SelectQueryBuilder } from 'typeorm'
import { User } from '../../users/entities'
import { Violation } from './violation.entity'
import { ViolationUpdateType } from './violation-update.entity'
import { ViolationsFilters } from '../api/violations-filters.dto'
import { TownsRepository } from 'src/sections/entities/towns.repository'
import { SectionsRepository } from 'src/sections/entities/sections.repository'

@Injectable()
export class ViolationsRepository {
  constructor(
    @InjectRepository(Violation) private readonly repo: Repository<Violation>,
    private readonly townsRepo: TownsRepository,
    @Inject(SectionsRepository)
    private readonly sectionsRepo: SectionsRepository,
  ) {}

  findOneOrFail(id: string): Promise<Violation> {
    return this.repo.findOneOrFail({
      where: { id },
      relations: [
        'section',
        'town',
        'pictures',
        'updates',
        'updates.actor',
        'updates.actor.organization',
        'assignees',
      ],
    })
  }

  async findPublishedViolations(after?: string): Promise<Violation[]> {
    const qbUnique = this.repo.createQueryBuilder('violation')
    qbUnique.select('violation.id')
    qbUnique.innerJoin('violation.updates', 'updates')
    qbUnique.innerJoin('violation.town', 'town')
    qbUnique.innerJoin('town.country', 'country')
    qbUnique.andWhere('violation.isPublished = true')
    qbUnique.limit(50)
    qbUnique.groupBy('violation.id')
    qbUnique.orderBy('violation.id', 'DESC')

    // Simple cursor pagination
    if (after) {
      qbUnique.andWhere('violation.id < :after', { after })
    }

    const violationIds = (await qbUnique.getMany()).map((x) => x.id)

    const qb = this.repo.createQueryBuilder('violation')

    qb.leftJoinAndSelect('violation.section', 'section')
    qb.innerJoinAndSelect('violation.updates', 'updates')
    qb.leftJoinAndSelect('section.cityRegion', 'cityRegion')
    qb.leftJoinAndSelect('section.electionRegion', 'electionRegion')
    qb.innerJoinAndSelect('violation.town', 'town')
    qb.innerJoinAndSelect('town.country', 'country')
    qb.leftJoinAndSelect('town.municipality', 'municipality')
    qb.leftJoinAndSelect('municipality.electionRegions', 'electionRegions')
    qb.andWhereInIds(violationIds)
    qb.orderBy('violation.id', 'DESC')

    return qb.getMany()
  }

  async findPublishedViolationsSegment(segment: string): Promise<Violation[]> {
    const violationsWithSections = await (
      await this.queryBuilderViolationWithSections(segment)
    ).getMany()
    let totalViolations = violationsWithSections
    if (segment.length != 9) {
      const violationsWithoutSections = await (
        await this.queryBuilderViolationWithoutSections(segment)
      ).getMany()
      totalViolations = violationsWithSections.concat(violationsWithoutSections)
      totalViolations.sort((violation1, violation2) =>
        violation2.id.localeCompare(violation1.id),
      )
      totalViolations.slice(0, 20)
    }

    return totalViolations
  }

  private async queryBuilderViolationWithoutSections(
    segment: string,
  ): Promise<SelectQueryBuilder<Violation>> {
    const subqueryViolationWithoutSection = this.sectionsRepo
      .getRepo()
      .createQueryBuilder('sections')
      .select('sections.town_id')
      .andWhere('sections.id like :segment')
      .groupBy('sections.town_id')

    const queryIds = this.qbVioldationIds()
    queryIds.innerJoin(
      '(' + subqueryViolationWithoutSection.getQuery() + ')',
      'sections',
      '"violation"."town_id" = "sections"."town_id"',
    )
    queryIds.andWhere('violation.section_id IS NULL')
    queryIds.setParameter('segment', `${segment}%`)

    const ids = (await queryIds.getMany()).map((x) => x.id)
    const query = this.qbViolations(ids)

    return query
  }

  private async queryBuilderViolationWithSections(
    segment: string,
  ): Promise<SelectQueryBuilder<Violation>> {
    const queryIds = this.qbVioldationIds()
    queryIds.innerJoin('violation.section', 'sections')
    queryIds.andWhere('sections.id like :segment', { segment: `${segment}%` })
    const ids = (await queryIds.getMany()).map((x) => x.id)

    const qb = this.qbViolations(ids)
    qb.innerJoinAndSelect('violation.section', 'section')
    qb.leftJoinAndSelect('section.cityRegion', 'cityRegion')
    qb.leftJoinAndSelect('section.electionRegion', 'electionRegion')

    return qb
  }

  private qbViolations(ids: string[]): SelectQueryBuilder<Violation> {
    const qb = this.repo.createQueryBuilder('violation')
    qb.innerJoinAndSelect('violation.updates', 'updates')
      .innerJoinAndSelect('violation.town', 'town')
      .innerJoinAndSelect('town.country', 'country')
      .leftJoinAndSelect('town.municipality', 'municipality')
      .leftJoinAndSelect('municipality.electionRegions', 'electionRegions')
      .andWhereInIds(ids)
      .andWhere('violation.isPublished = true')

    return qb
  }

  private qbVioldationIds(): SelectQueryBuilder<Violation> {
    return this.repo
      .createQueryBuilder('violation')
      .select('violation.id')
      .innerJoin('violation.updates', 'updates')
      .innerJoin('violation.town', 'town')
      .innerJoin('town.country', 'country')
      .andWhere('violation.isPublished = true')
      .limit(20)
      .groupBy('violation.id')
      .orderBy('violation.id', 'DESC')
  }

  queryBuilderWithFilters(
    filters: ViolationsFilters,
  ): SelectQueryBuilder<Violation> {
    const qb = this.repo.createQueryBuilder('violation')

    qb.innerJoinAndSelect('violation.town', 'town')
    qb.innerJoinAndSelect('violation.updates', 'updates')
    qb.innerJoinAndSelect('updates.actor', 'actor')
    qb.innerJoin('violation.updates', 'update_send')
    qb.andWhere('update_send.type = :update', {
      update: ViolationUpdateType.SEND,
    })
    qb.innerJoin('update_send.actor', 'sender')
    qb.innerJoinAndSelect('sender.organization', 'organization')
    qb.leftJoinAndSelect('violation.pictures', 'picture')

    if (filters.assignee) {
      qb.innerJoinAndSelect('violation.assignees', 'assignee')
      qb.andWhere('assignee.id = :assignee', { assignee: filters.assignee })
    } else {
      qb.leftJoinAndSelect('violation.assignees', 'assignee')
    }

    if (filters.section) {
      qb.innerJoinAndSelect('violation.section', 'section')
      qb.andWhere('section.id LIKE :section', {
        section: `${filters.section}%`,
      })
    } else {
      qb.leftJoinAndSelect('violation.section', 'section')
    }

    if (filters.electionRegion) {
      if (filters.electionRegion != '32') {
        qb.innerJoin('town.municipality', 'municipality')
        qb.innerJoin('municipality.electionRegions', 'electionRegions')
        qb.andWhere('electionRegions.code = :electionRegion', {
          electionRegion: filters.electionRegion,
        })

        if (filters.municipality) {
          qb.andWhere('municipality.code = :municipality', {
            municipality: filters.municipality,
          })
        }

        if (filters.country) {
          qb.innerJoin('town.country', 'country')
          qb.andWhere('country.code = :country', { country: filters.country })
        }
      } else {
        qb.innerJoin('town.country', 'country')
        if (filters.country) {
          qb.andWhere('country.code = :country', { country: filters.country })
        } else {
          qb.andWhere('country.code != :country', { country: '00' })
        }
      }

      if (filters.town) {
        qb.andWhere('town.code = :town', {
          town: filters.town,
        })
      }
    }

    if (filters.status) {
      qb.andWhere('violation.status = :status', { status: filters.status })
    }

    if (filters.published) {
      qb.andWhere('violation.isPublished = :published', {
        published: filters.published,
      })
    }

    if (filters.organization) {
      qb.andWhere('organization.id = :organization', {
        organization: filters.organization,
      })
    }

    return qb
  }

  async save(violation: Violation): Promise<Violation> {
    if (violation.town && !violation.town.id && violation.town.code) {
      violation.town = await this.townsRepo.findOneByCode(violation.town.code)
    }
    await this.repo.save(violation)

    return this.findOneOrFail(violation.id)
  }

  findByAuthor(author: User): Promise<Violation[]> {
    return this.repo.find({
      relations: ['section', 'pictures', 'town'],
      join: {
        alias: 'violation',
        innerJoin: {
          update: 'violation.updates',
        },
      },
      where: {
        updates: {
          actor: {
            id: author.id,
          },
          type: ViolationUpdateType.SEND,
        },
      },
    })
  }
}
