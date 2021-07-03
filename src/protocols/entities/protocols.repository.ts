import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities';
import {
  Repository,
  SelectQueryBuilder,
  getConnection,
  In,
  Brackets,
} from 'typeorm';
import { ProtocolActionType } from './protocol-action.entity';
import { Protocol, ProtocolStatus } from './protocol.entity';
import { ProtocolFilters } from '../api/protocols-filters.dto';
import { shuffle } from 'lodash';

export class InvalidFiltersError extends Error {}

export class EmptyPersonalProtocolQueue extends Error {}
@Injectable()
export class ProtocolsRepository {
  constructor(
    @InjectRepository(Protocol) private readonly repo: Repository<Protocol>,
  ) {}

  getRepo(): Repository<Protocol> {
    return this.repo;
  }

  findOneOrFail(id: string): Promise<Protocol> {
    return this.repo.findOneOrFail({
      where: { id },
      relations: [
        'pictures',
        'data',
        'results',
        'actions',
        'actions.actor',
        'actions.actor.organization',
        'results.party',
        'assignees',
      ],
    });
  }

  async save(protocol: Protocol): Promise<Protocol> {
    await this.repo.save(protocol);

    return this.findOneOrFail(protocol.id);
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
      where: (qb: SelectQueryBuilder<Protocol>) => {
        qb.where('action.actor_id = :authorId', {
          authorId: author.id,
        }).andWhere('action.action = :action', {
          action: ProtocolActionType.SEND,
        });
      },
    });
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
    } = filters;

    const qb = this.repo.createQueryBuilder('protocol');

    qb.innerJoinAndSelect('protocol.section', 'section');
    qb.innerJoinAndSelect('section.town', 'town');
    qb.innerJoinAndSelect('protocol.pictures', 'picture');
    qb.innerJoinAndSelect('protocol.actions', 'action');
    qb.innerJoinAndSelect('action.actor', 'actor');
    qb.andWhere('action.action = :action', {
      action: ProtocolActionType.SEND,
    });
    qb.innerJoinAndSelect('actor.organization', 'organization');

    if (assignee) {
      qb.innerJoinAndSelect('protocol.assignees', 'assignee');
      qb.andWhere('assignee.id = :assignee', { assignee });
    } else {
      qb.leftJoinAndSelect('protocol.assignees', 'assignee');
    }

    if (electionRegion !== '32' && country && country !== '00') {
      // this is useful to prevent cases where country code matches municipality code
      // while keeping performance quick as mostly doing filters by `section.id like ":prefix%"`
      throw new InvalidFiltersError(
        'Incompatible input filters! Domestic region cannot be combined with a country abroad.',
      );
    }

    const sectionPrefix =
      (electionRegion || '') +
      (municipality || country || '') +
      (cityRegion || '');

    if (sectionPrefix.length > 0) {
      qb.andWhere('section.id LIKE :sectionPrefix', {
        sectionPrefix: `${sectionPrefix}%`,
      });
    }
    // Keep both filters in order to exclude confusing results from mixed filters
    if (section) {
      qb.andWhere('section.id LIKE :section', {
        section: `${section}%`,
      });
    }

    if (town) {
      qb.andWhere('town.code = :town', { town });
    }

    if (status) {
      qb.andWhere('protocol.status = :status', { status });
    }

    if (organization) {
      qb.andWhere('organization.id = :organization', { organization });
    }

    if (origin) {
      qb.andWhere('protocol.origin = :origin', { origin });
    }

    return qb;
  }

  async findAll(): Promise<Protocol[]> {
    return this.repo.find();
  }

  async findNextAvailableProtocol(user: User): Promise<Protocol> {
    const allAssignedProtocols = (
      await this.repo
        .createQueryBuilder('protocol')
        .select('protocol.id')
        .innerJoin('protocol.actions', 'action_assign')
        .andWhere('action_assign.action = :assignAction', {
          assignAction: ProtocolActionType.ASSIGN,
        })
        .andWhere('action_assign.actor_id = :assignActorId', {
          assignActorId: user.id,
        })
        .getRawMany()
    ).map((protocol) => protocol.protocol_id);

    const qb = this.repo
      .createQueryBuilder('protocol')
      .innerJoin('protocol.actions', 'action_send')
      .leftJoin('protocol.assignees', 'assignee')
      .andWhere('assignee.id IS NULL')
      .andWhere('protocol.status = :status', {
        status: ProtocolStatus.RECEIVED,
      })
      .andWhere('action_send.action = :sendAction', {
        sendAction: ProtocolActionType.SEND,
      })
      .addOrderBy('action_send.timestamp', 'ASC')
      .limit(100);

    if (allAssignedProtocols.length > 0) {
      qb.andWhere('protocol.id not in (:...allAssignedProtocols)', {
        allAssignedProtocols,
      });
    }

    const batch = await qb.getMany();

    if (batch.length === 0) {
      throw new EmptyPersonalProtocolQueue(
        'Cannot find an available protocol for you!',
      );
    }

    const selected = shuffle<Protocol>(batch)[0];

    return this.findOneOrFail(selected.id);
  }

  async findAssignedPendingProtocol(user: User): Promise<Protocol> {
    const qb = this.repo
      .createQueryBuilder('protocol')
      .innerJoin('protocol.assignees', 'assignee')
      .andWhere('assignee.id = :assigneeId', { assigneeId: user.id })
      .andWhere('protocol.status = :received', {
        received: ProtocolStatus.RECEIVED,
      })
      .limit(1)
      .orderBy('protocol.id', 'ASC');

    return this.findOneOrFail((await qb.getOneOrFail()).id);
  }

  async findApprovedProtocols(): Promise<Protocol[]> {
    const qb = this.repo.createQueryBuilder('protocol');
    qb.innerJoinAndSelect('protocol.results', 'results');
    qb.innerJoinAndSelect('protocol.section', 'section');
    qb.innerJoinAndSelect('section.election_region', 'election_region');
    qb.innerJoinAndSelect('section.town', 'town');
    qb.innerJoinAndSelect('town.municipality', 'municipality');
    qb.innerJoinAndSelect('town.country', 'country');
    qb.innerJoinAndSelect('section.cityRegion', 'cityRegion');
    qb.andWhere('protocol.status = :status', {
      status: ProtocolStatus.APPROVED,
    });

    return qb.getMany();
  }

  async findPublishedProtocolsFrom(
    partialSectionIds: string[],
  ): Promise<Protocol[]> {
    const qb = this.repo.createQueryBuilder('protocol');
    qb.innerJoinAndSelect('protocol.results', 'results');
    qb.innerJoinAndSelect('protocol.section', 'section');
    qb.andWhere(
      new Brackets((qbNested: SelectQueryBuilder<Protocol>) => {
        partialSectionIds.forEach((partialSectionId: string) => {
          qbNested.orWhere('section.id LIKE :sectionId', {
            sectionId: `${partialSectionId}%`,
          });
        });
      }),
    );
    qb.andWhere('protocol.status = :status', {
      status: ProtocolStatus.PUBLISHED,
    });

    return qb.getMany();
  }

  async markProtocolsAsPublished(protocols: Protocol[]): Promise<void> {
    this.markProtocolsAs(ProtocolStatus.PUBLISHED, protocols);
  }

  async markProtocolsAsReplaced(protocols: Protocol[]): Promise<void> {
    this.markProtocolsAs(ProtocolStatus.REPLACED, protocols);
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
      .execute();
  }
}
