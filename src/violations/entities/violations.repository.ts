import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../../users/entities';
import { Violation } from './violation.entity';
import { ViolationUpdateType } from './violation-update.entity';

@Injectable()
export class ViolationsRepository {
  constructor(@InjectRepository(Violation) private readonly repo: Repository<Violation>) {}

  findOneOrFail(id: string): Promise<Violation> {
    return this.repo.findOneOrFail({ where: { id }, relations: ['section', 'town', 'pictures', 'updates', 'updates.actor'] } );
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
          update: 'violation.updates'
        }
      },
      where: (qb: SelectQueryBuilder<Violation>) => {
        qb
          .where('update.actor_id = :authorId', { authorId: author.id })
          .andWhere('update.type = :type', { type: ViolationUpdateType.SEND });
      }
    });
  }
}
