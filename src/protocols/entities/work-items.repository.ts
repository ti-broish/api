import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { shuffle } from 'lodash';
import { WorkItem, WorkItemType } from './work-item.entity';
import { Protocol } from './protocol.entity';
import {
  EmptyPersonalProtocolQueue,
  ProtocolsRepository,
} from './protocols.repository';

@Injectable()
export class WorkItemsRepository {
  constructor(
    @InjectRepository(WorkItem) private readonly repo: Repository<WorkItem>,
    @Inject(ProtocolsRepository)
    private readonly protocolsRepo: ProtocolsRepository,
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
      relations: ['protocol', 'assignee'],
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
    const allAssignedProtocols =
      await this.protocolsRepo.getAllAssignedProtocols(user);
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
      .limit(200)
      .orderBy('workItem.id', 'ASC');

    return (await qb.getOneOrFail()) as WorkItem;
  }
}
