import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProtocolActionType } from './protocol-actions.entity';
import { Protocol } from './protocol.entity';

@Injectable()
export class ProtocolsRepository {
  constructor(@InjectRepository(Protocol) private readonly repo: Repository<Protocol>) {}

  findOneOrFail(id: string): Promise<Protocol> {
    return this.repo.findOneOrFail({ where: { id }, relations: ['section', 'pictures', 'data', 'results', 'actions', 'actions.actor', 'results.party'] } );
  }

  async save(protocol: Protocol): Promise<Protocol> {
    await this.repo.save(protocol);

    return this.findOneOrFail(protocol.id);
  }

  findByAuthor(author: User): Promise<Protocol[]> {
    return this.repo.find({
      relations: ['section', 'pictures'],
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
}
