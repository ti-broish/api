import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../../users/entities';
import { Violation } from './violation.entity';
import { ViolationUpdateType } from './violation-update.entity';
import { ViolationsFilters } from '../api/violations-filters.dto';
import { TownsRepository } from 'src/sections/entities/towns.repository';

@Injectable()
export class ViolationsRepository {
  constructor(
    @InjectRepository(Violation) private readonly repo: Repository<Violation>,
    private readonly townsRepo: TownsRepository,
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

    qb.innerJoinAndSelect('violation.town', 'town');
    qb.innerJoinAndSelect('violation.updates', 'updates');
    qb.innerJoinAndSelect('updates.actor', 'actor');
    qb.innerJoin('violation.updates', 'update_send');
    qb.andWhere('update_send.type = :update', {
      update: ViolationUpdateType.SEND,
    });
    qb.innerJoin('update_send.actor', 'sender');
    qb.innerJoinAndSelect('sender.organization', 'organization');
    qb.leftJoinAndSelect('violation.pictures', 'picture');

    if (filters.assignee) {
      qb.innerJoinAndSelect('violation.assignees', 'assignee');
      qb.andWhere('assignee.id = :assignee', { assignee: filters.assignee });
    } else {
      qb.leftJoinAndSelect('violation.assignees', 'assignee');
    }

    if (filters.section) {
      qb.innerJoinAndSelect('violation.section', 'section');
      qb.andWhere('section.id LIKE :section', {
        section: `${filters.section}%`,
      });
    } else {
      qb.leftJoinAndSelect('violation.section', 'section');
    }

    if (filters.electionRegion) {
      qb.innerJoin('town.municipality', 'municipality');
      qb.innerJoin('municipality.electionRegions', 'electionRegions');
      qb.andWhere('electionRegions.code = :electionRegion', {
        electionRegion: filters.electionRegion,
      });

      if (filters.municipality) {
        qb.andWhere('municipality.code = :municipality', {
          municipality: filters.municipality,
        });
      }

      if (filters.country) {
        qb.innerJoin('town.country', 'country');
        qb.andWhere('country.code = :country', { country: filters.country });
      }

      if (filters.town) {
        qb.andWhere('town.code = :town', {
          town: filters.town,
        });
      }
    }

    if (filters.status) {
      qb.andWhere('violation.status = :status', { status: filters.status });
    }

    if (filters.published) {
      qb.andWhere('violation.isPublished = :published', {
        published: filters.published,
      });
    }

    if (filters.organization) {
      qb.andWhere('organization.id = :organization', {
        organization: filters.organization,
      });
    }

    return qb;
  }

  async save(violation: Violation): Promise<Violation> {
    if (violation.town && !violation.town.id && violation.town.code) {
      violation.town = await this.townsRepo.findOneByCode(violation.town.code);
    }
    await this.repo.save(violation);

    return this.findOneOrFail(violation.id);
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
      where: (qb: SelectQueryBuilder<Violation>) => {
        qb.where('update.actor_id = :authorId', {
          authorId: author.id,
        }).andWhere('update.type = :type', { type: ViolationUpdateType.SEND });
      },
    });
  }
}
