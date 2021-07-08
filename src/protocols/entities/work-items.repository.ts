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
import { WorkItem, WorkItemType } from './work-item.entity';
import { Protocol } from './protocol.entity';
import { EmptyPersonalProtocolQueue } from './protocols.repository';

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
    const workItems: WorkItem[] = Array.isArray(input) ? input : [input];
    if (workItems.length === 0) {
      throw new Error('No work items provided');
    }
    await this.repo.save(workItems);

    return Array.isArray(input) ? workItems : workItems[0];
  }

  async findNextAvailableItem(
    user: User,
    types: WorkItemType[],
  ): Promise<WorkItem> {
    const allAssignedProtocols = await this.getAllAssignedProtocols(user);
    const qb = this.repo
      .createQueryBuilder('workItem')
      .innerJoinAndSelect('workItem.protocol', 'protocol')
      .innerJoinAndSelect('protocol.pictures', 'pictures')
      .andWhere('workItem.isAssigned = false')
      .andWhere('workItem.isComplete = false')
      .andWhere('workItem.type IN (:...types)', { types })
      .limit(1);

    if (allAssignedProtocols.length > 0) {
      qb.andWhere('workItem.protocol_id not in (:...allAssignedProtocols)', {
        allAssignedProtocols,
      });
    }

    const batch = await qb.getMany();

    if (batch.length === 0) {
      throw new EmptyPersonalProtocolQueue(
        'Cannot find an available protocol for you!',
      );
    }

    return shuffle<WorkItem>(batch)[0];
  }

  async findAssignedOpenItem(user: User): Promise<WorkItem> {
    const qb = this.repo
      .createQueryBuilder('workItem')
      .innerJoinAndSelect('workItem.protocol', 'protocol')
      .innerJoinAndSelect('protocol.pictures', 'pictures')
      .andWhere('workItem.assignee_id = :assignee', { assignee: user.id })
      .andWhere('workItem.isComplete = false')
      .limit(1)
      .orderBy('workItem.id', 'ASC');

    return (await qb.getOneOrFail()) as WorkItem;
  }

  private async getAllAssignedProtocols({
    id: assigneeId,
  }: User): Promise<string[]> {
    return (
      await this.repo
        .createQueryBuilder('workItem')
        .select('workItem.protocol_id', 'protocol_id')
        .andWhere('workItem.assignee_id = :assigneeId', { assigneeId })
        .getRawMany()
    ).map((workItem) => workItem.protocol_id);
  }
}
