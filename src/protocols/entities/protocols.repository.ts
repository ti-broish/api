import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProtocolActionType } from './protocol-action.entity';
import { Protocol } from './protocol.entity';

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

  async findAll(): Promise<Protocol[]> {
    return this.repo.find();
  }
}
