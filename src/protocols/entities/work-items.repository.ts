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
import { shuffle } from 'lodash';
import { WorkItem } from './work-item.entity';
import { Protocol } from './protocol.entity';

@Injectable()
export class WorkItemsRepository {
  constructor(
    @InjectRepository(WorkItem) private readonly repo: Repository<WorkItem>,
  ) {}

  getRepo(): Repository<WorkItem> {
    return this.repo;
  }

  findOne(protocol: Protocol, assignee: User): Promise<WorkItem | null> {
    return this.repo.findOne({
      join: {
        alias: 'workItem',
        innerJoin: {
          protocol: 'workItem.protocol',
          assignee: 'workItem.assignee',
        },
      },
      where: (qb: SelectQueryBuilder<WorkItem>) => {
        qb.andWhere('protocol.id = :protocolId', {
          protocolId: protocol.id,
        }).andWhere('assignee.id = :assignee', {
          assignee: assignee.id,
        });
      },
      relations: ['protocol'],
    });
  }

  async save(workItem: WorkItem): Promise<WorkItem>;
  async save(workItems: WorkItem[]): Promise<WorkItem[]>;

  async save(input: WorkItem | WorkItem[]): Promise<WorkItem | WorkItem[]> {
    const workItems = Array.isArray(input) ? input : [input];
    await this.repo.save(workItems);

    return workItems;
  }
}
