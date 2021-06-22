import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../../users/entities';
import { Violation } from './violation.entity';
import { ViolationUpdateType } from './violation-update.entity';
import { ViolationsFilters } from '../api/violations-filters.dto';

@Injectable()
export class ViolationsRepository {
  constructor(
    @InjectRepository(Violation) private readonly repo: Repository<Violation>,
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
    });
  }

  queryBuilderWithFilters(
    filters: ViolationsFilters,
  ): SelectQueryBuilder<Violation> {
    const qb = this.repo.createQueryBuilder('violation');

    qb.leftJoinAndSelect('violation.section', 'section');
    qb.innerJoinAndSelect('violation.town', 'town');
    qb.innerJoinAndSelect('violation.updates', 'update');
    qb.innerJoinAndSelect('update.actor', 'actor');
    qb.innerJoinAndSelect('actor.organization', 'organization');
    qb.leftJoinAndSelect('violation.pictures', 'picture');

    if (filters.assignee) {
      qb.innerJoin('violation.assignees', 'assignee');
      qb.andWhere('assignee.id = :assignee', { assignee: filters.assignee });
    } else {
      qb.leftJoinAndSelect('violation.assignees', 'assignee');
    }

    if (filters.section) {
      qb.andWhere('section.id LIKE :section', {
        section: `${filters.section}%`,
      });
    }

    if (filters.status) {
      qb.andWhere('violation.status = :status', { status: filters.status });
    }

    if (filters.town) {
      qb.andWhere('town.code = :town', { town: filters.town });
    }

    if (filters.author || filters.organization) {
      qb.innerJoin('violation.updates', 'update_send');
      qb.andWhere('update_send.type = :update', {
        update: ViolationUpdateType.SEND,
      });

      if (filters.author) {
        qb.andWhere('update_send.actor_id = :author', {
          author: filters.author,
        });
      }

      if (filters.organization) {
        qb.innerJoin('update_send.actor', 'sender');
        qb.innerJoin('sender.organization', 'organization');
        qb.andWhere('organization.id = :organization', {
          organization: filters.organization,
        });
      }
    }

    return qb;
  }

  async save(violation: Violation): Promise<Violation> {
    await this.repo.save(violation);

    return this.findOneOrFail(violation.id);
  }

  findByAuthor(author: User): Promise<Violation[]> {
    return this.repo.find({
      relations: ['section', 'pictures'],
      join: {
        alias: 'violation',
        innerJoin: {
          update: 'violation.updates',
        },
      },
      where: (qb: SelectQueryBuilder<Violation>) => {
        qb.where('update.actor_id = :authorId', {
          authorId: author.id,
        }).andWhere('update.type = :type', { type: ViolationUpdateType.SEND });
      },
    });
  }
}
