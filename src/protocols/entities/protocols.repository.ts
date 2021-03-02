import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities';
import { QueryBuilder, Repository, SelectQueryBuilder } from 'typeorm';
import { ProtocolActionType } from './protocol-action.entity';
import { Protocol, ProtocolStatus } from './protocol.entity';
import { ProtocolFilters } from '../api/protocols-filters.dto';

@Injectable()
export class ProtocolsRepository {
  constructor(@InjectRepository(Protocol) private readonly repo: Repository<Protocol>) {}

  getRepo(): Repository<Protocol> {
    return this.repo;
  }

  findOneOrFail(id: string): Promise<Protocol> {
    return this.repo.findOneOrFail({ where: { id }, relations: ['pictures', 'data', 'results', 'actions', 'actions.actor', 'results.party', 'assignees'] } );
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
          action: 'protocol.actions'
        }
      },
      where: (qb: SelectQueryBuilder<Protocol>) => {
        qb
          .where('action.actor_id = :authorId', { authorId: author.id })
          .andWhere('action.action = :action', { action: ProtocolActionType.SEND });
      }
    });
  }

  queryBuilderWithFilters(filters: ProtocolFilters): SelectQueryBuilder<Protocol> {
    const qb = this.repo.createQueryBuilder('protocol');

    qb.innerJoinAndSelect('protocol.section', 'section');
    qb.innerJoinAndSelect('protocol.pictures', 'picture');

    if (filters.assignee) {
      qb.innerJoin('protocol.assignees', 'assignee');
      qb.andWhere('assignee.id = :assignee', { assignee: filters.assignee });
    } else {
      qb.leftJoinAndSelect('protocol.assignees', 'assignee');
    }

    if (filters.section) {
      qb.andWhere('section.id LIKE :section', { section: `${filters.section}%` });
    }

    if (filters.status) {
      qb.andWhere('protocol.status = :status', { status: filters.status });
    }

    if (filters.author) {
      qb.innerJoin('protocol.actions', 'action');
      qb.andWhere('action.actor_id = :author', { author: filters.author });
      qb.andWhere('action.action = :action', { action: ProtocolActionType.SEND });
    }

    return qb;
  }

  async findAll(): Promise<Protocol[]> {
    return this.repo.find();
  }

  async findNextAvailableProtocol(): Promise<Protocol|null> {
    const qb = this.repo.createQueryBuilder('protocol');
    qb.innerJoin('protocol.actions', 'action');
    qb.leftJoin('protocol.assignees', 'assignee');
    qb.andWhere('assignee.id IS NULL');
    qb.andWhere('protocol.status = :status', { status: ProtocolStatus.RECEIVED });
    qb.andWhere('action.action = :action', { action: ProtocolActionType.SEND });
    qb.addOrderBy('action.timestamp', 'ASC');

    const protocol = await qb.getOne();

    if (!protocol) {
      return null;
    }

    return this.findOneOrFail(protocol.id);
  }
}
