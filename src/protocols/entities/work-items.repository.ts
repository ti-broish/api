import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '../../users/entities'
import { Repository } from 'typeorm'
import { WorkItem, WorkItemType } from './work-item.entity'
import { Protocol } from './protocol.entity'
import {
  EmptyPersonalProtocolQueue,
  ProtocolsRepository,
} from './protocols.repository'

@Injectable()
export class WorkItemsRepository extends Repository<WorkItem> {
  constructor(
    @InjectRepository(WorkItem) repository: Repository<WorkItem>,
    @Inject(ProtocolsRepository)
    private readonly protocolsRepo: ProtocolsRepository,
  ) {
    super(
      repository.target,
      repository.manager,
      repository.manager.connection.createQueryRunner(),
    )
  }

  async start(): Promise<void> {
    await this.queryRunner.connect()
    await this.queryRunner.startTransaction()
  }

  async commit(): Promise<void> {
    await this.queryRunner.commitTransaction()
  }

  async rollback(): Promise<void> {
    await this.queryRunner.rollbackTransaction()
  }

  findOneByProtocolAndAssignee(
    protocol: Protocol,
    assignee: User,
  ): Promise<WorkItem | null> {
    return super.findOne({
      join: {
        alias: 'workItem',
        innerJoin: {
          protocol: 'workItem.protocol',
          assignee: 'workItem.assignee',
        },
      },
      where: {
        protocol: {
          id: protocol.id,
        },
        assignee: {
          id: assignee.id,
        },
      },
      relations: ['protocol', 'assignee'],
    })
  }

  async save(workItem: WorkItem): Promise<WorkItem>
  async save(workItems: WorkItem[]): Promise<WorkItem[]>
  async save(input: WorkItem | WorkItem[]): Promise<WorkItem | WorkItem[]> {
    const isArray = Array.isArray(input)
    const workItems: WorkItem[] = isArray ? input : [input]
    const results = await this.saveWorkItems(workItems)

    return isArray ? results : results[0]
  }

  private async saveWorkItems(workItems: WorkItem[]): Promise<WorkItem[]> {
    if (workItems.length === 0) {
      throw new Error('No work items provided')
    }
    if (this.queryRunner.isTransactionActive) {
      await this.queryRunner.manager.save(workItems)
    } else {
      await super.save(workItems)
    }

    return workItems
  }

  async findNextAvailableItem(
    user: User,
    types: WorkItemType[],
  ): Promise<WorkItem> {
    const allAssignedProtocols =
      await this.protocolsRepo.getAllAssignedProtocols(user)
    const qb = super
      .createQueryBuilder('workItem')
      .innerJoinAndSelect('workItem.protocol', 'protocol')
      .innerJoinAndSelect('protocol.pictures', 'pictures')
      .andWhere('workItem.isAssigned = false')
      .setLock('pessimistic_write')
      .setOnLocked('skip_locked')
      .andWhere('workItem.isComplete = false')
      .andWhere('workItem.type IN (:...types)', { types })
      .limit(1)

    if (allAssignedProtocols.length > 0) {
      qb.andWhere('workItem.protocol_id not in (:...allAssignedProtocols)', {
        allAssignedProtocols,
      })
    }

    const workItem = await qb.getOne()

    if (!workItem) {
      throw new EmptyPersonalProtocolQueue(
        'Cannot find an available protocol for you!',
      )
    }

    return workItem
  }

  async findAssignedOpenItem(user: User): Promise<WorkItem> {
    const qb = super
      .createQueryBuilder('workItem')
      .innerJoinAndSelect('workItem.protocol', 'protocol')
      .innerJoinAndSelect('protocol.pictures', 'pictures')
      .andWhere('workItem.assignee_id = :assignee', { assignee: user.id })
      .andWhere('workItem.isComplete = false')
      .limit(200)
      .orderBy('workItem.id', 'ASC')

    return await qb.getOneOrFail()
  }

  async findCompletedItems(): Promise<WorkItem[]> {
    return super
      .createQueryBuilder('workItem')
      .innerJoinAndSelect('workItem.protocol', 'protocol')
      .innerJoinAndSelect('protocol.children', 'children')
      .andWhere('workItem.isComplete = true')
      .getMany()
  }
}
