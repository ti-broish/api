import { Command, Positional, Option } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { WorkQueue } from '../api/work-queue.service';
import { ProtocolsRepository } from '../entities/protocols.repository';
import { Protocol } from '../entities/protocol.entity';
import { WorkItemsRepository } from '../entities/work-items.repository';
import { WorkItem } from '../entities/work-item.entity';

@Injectable()
export class ProtocolResolutionCommand {
  constructor(
    private readonly workQueue: WorkQueue,
    private readonly workItemsRepository: WorkItemsRepository,
    private readonly protocolsRepo: ProtocolsRepository,
  ) {}

  @Command({
    command: 'protocols:resolve',
    describe: 'Check resolution for processed protocols in the work queue',
    autoExit: true, // defaults to `true`, but you can use `false` if you need more control
  })
  async create() {
    const workItems = await this.workItemsRepository.findCompletedItems();
    const dedupedWorkItems = workItems.reduce((acc, workItem: WorkItem) => {
      if (!acc[workItem.protocol.id]) {
        acc[workItem.protocol.id] = workItem;
      }
      return acc;
    }, {});
    Object.entries(dedupedWorkItems).forEach(
      async ([, workItem]: [any, WorkItem]) => {
        const child = workItem.protocol.children[0];
        await this.workQueue.checkResolution(
          workItem.assignee,
          workItem,
          child,
        );
      },
    );
  }
}
