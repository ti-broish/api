import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '../../users/entities'
import {
  Repository,
  SelectQueryBuilder,
  getConnection,
  In,
  Brackets,
} from 'typeorm'
import { ProtocolActionType } from './protocol-action.entity'
import { Protocol, ProtocolStatus } from './protocol.entity'
import { ProtocolFilters } from '../api/protocols-filters.dto'

export class InvalidFiltersError extends Error {}

export class EmptyPersonalProtocolQueue extends Error {}
@Injectable()
export class ProtocolsRepository {
  constructor(
    @InjectRepository(Protocol) private readonly repo: Repository<Protocol>,
  ) {}

  getRepo(): Repository<Protocol> {
    return this.repo
  }

  findOneOrFail(id: string): Promise<Protocol> {
    return this.repo.findOneOrFail({
      where: { id },
      relations: [
        'section',
        'parent',
        'pictures',
        'results',
        'actions',
        'actions.actor',
        'actions.actor.organization',
        'results.party',
        'assignees',
      ],
    })
  }

  async save(protocol: Protocol): Promise<Protocol> {
    await this.repo.save(protocol)

    return this.findOneOrFail(protocol.id)
  }

  findByAuthor(author: User): Promise<Protocol[]> {
    return this.repo.find({
      relations: ['pictures'],
      join: {
        alias: 'protocol',
        innerJoin: {
          action: 'protocol.actions',
        },
      },
      where: {
        actions: {
          actor: {
            id: author.id,
          },
          action: ProtocolActionType.SEND,
        },
      },
    })
  }

  queryBuilderWithFilters(
    filters: ProtocolFilters,
  ): SelectQueryBuilder<Protocol> {
    const {
      assignee,
      section,
      status,
      organization,
      origin,
      electionRegion,
      country,
      town,
      cityRegion,
      municipality,
    } = filters

    const qb = this.repo.createQueryBuilder('protocol')

    qb.leftJoinAndSelect('protocol.section', 'section')
    qb.leftJoinAndSelect('section.town', 'town')
    qb.innerJoinAndSelect('protocol.pictures', 'picture')
    qb.innerJoinAndSelect(
      'protocol.actions',
      'action',
      'action.action = :action',
      {
        action: ProtocolActionType.SEND,
      },
    )
    qb.leftJoinAndSelect('action.actor', 'actor')
    qb.leftJoinAndSelect('actor.organization', 'organization')

    if (assignee) {
      qb.innerJoinAndSelect('protocol.assignees', 'assignee')
      qb.andWhere('assignee.id = :assignee', { assignee })
    } else {
      qb.leftJoinAndSelect('protocol.assignees', 'assignee')
    }

    if (electionRegion !== '32' && country && country !== '00') {
      // this is useful to prevent cases where country code matches municipality code
      // while keeping performance quick as mostly doing filters by `section.id like ":prefix%"`
      throw new InvalidFiltersError(
        'Incompatible input filters! Domestic region cannot be combined with a country abroad.',
      )
    }

    const sectionPrefix =
      (electionRegion || '') +
      (municipality || country || '') +
      (cityRegion || '')

    if (sectionPrefix.length > 0) {
      qb.andWhere('section.id LIKE :sectionPrefix', {
        sectionPrefix: `${sectionPrefix}%`,
      })
    }
    // Keep both filters in order to exclude confusing results from mixed filters
    if (section) {
      qb.andWhere('section.id LIKE :section', {
        section: `${section}%`,
      })
    }

    if (town) {
      qb.andWhere('town.code = :town', { town })
    }

    if (status) {
      qb.andWhere('protocol.status = :status', { status })
    }

    if (organization) {
      qb.andWhere('organization.id = :organization', { organization })
    }

    if (origin) {
      qb.andWhere('protocol.origin = :origin', { origin })
    }

    return qb
  }

  async findAll(): Promise<Protocol[]> {
    return this.repo.find()
  }

  async findPublishedProtocolsFrom(
    partialSectionIds: string[],
  ): Promise<Protocol[]> {
    const qb = this.repo.createQueryBuilder('protocol')
    qb.innerJoinAndSelect('protocol.results', 'results')
    qb.innerJoinAndSelect('protocol.section', 'section')
    qb.andWhere(
      new Brackets((qbNested: SelectQueryBuilder<Protocol>) => {
        partialSectionIds.forEach((partialSectionId: string) => {
          qbNested.orWhere('section.id LIKE :sectionId', {
            sectionId: `${partialSectionId}%`,
          })
        })
      }),
    )
    qb.andWhere('protocol.status = :status', {
      status: ProtocolStatus.PUBLISHED,
    })

    return qb.getMany()
  }

  async markProtocolsAsPublished(protocols: Protocol[]): Promise<void> {
    this.markProtocolsAs(ProtocolStatus.PUBLISHED, protocols)
  }

  async markProtocolsAsReplaced(protocols: Protocol[]): Promise<void> {
    this.markProtocolsAs(ProtocolStatus.REPLACED, protocols)
  }

  private async markProtocolsAs(
    status: ProtocolStatus,
    protocols: Protocol[],
  ): Promise<void> {
    await getConnection()
      .createQueryBuilder()
      .update(Protocol)
      .set({ status })
      .where({ id: In(protocols.map((protocol: Protocol) => protocol.id)) })
      .execute()
  }

  async getAllAssignedProtocols({
    id: assignActorId,
  }: User): Promise<string[]> {
    return (
      await this.repo
        .createQueryBuilder('protocol')
        .select('protocol.id')
        .innerJoin('protocol.actions', 'action_assign')
        .andWhere('action_assign.action = :assignAction', {
          assignAction: ProtocolActionType.ASSIGN,
        })
        .andWhere('action_assign.actor_id = :assignActorId', { assignActorId })
        .getRawMany()
    ).map((protocol) => protocol.protocol_id)
  }

  async findBySection(sectionCode: string): Promise<Protocol[]> {
    const qb = this.repo.createQueryBuilder('protocol')
    qb.innerJoinAndSelect('protocol.section', 'section')
    qb.leftJoinAndSelect('protocol.pictures', 'pictures')
    qb.innerJoinAndSelect('protocol.results', 'results')
    qb.andWhere('protocol.section = :id', { id: sectionCode })
    qb.andWhere('protocol.status in (:...status)', {
      status: [ProtocolStatus.READY, ProtocolStatus.PUBLISHED],
    })

    return qb.getMany()
  }

  async findSettledProtocolFromParent(child: Protocol) {
    return this.repo
      .createQueryBuilder('protocol')
      .innerJoinAndSelect('protocol.section', 'section')
      .leftJoinAndSelect('protocol.results', 'results')
      .leftJoinAndSelect('results.party', 'party')
      .andWhere('protocol.parent_id = :parentId', { parentId: child.parent.id })
      .andWhere('protocol.id != :self', { self: child.id })
      .andWhere('protocol.status IN (:...statuses)', {
        statuses: [ProtocolStatus.READY, ProtocolStatus.REJECTED],
      })
      .getOne()
  }
}
