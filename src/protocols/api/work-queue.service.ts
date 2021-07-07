import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Protocol } from '../entities/protocol.entity';
import { WorkItem } from '../entities/work-item.entity';
import { WorkItemsRepository } from '../entities/work-items.repository';

const PROTOCOLS_VALIDATION_ITERATIONS = 'PROTOCOLS_VALIDATION_ITERATIONS';

export class WorkQueue {
  constructor(
    private readonly worksItemsRepo: WorkItemsRepository,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  async addProtocol(protocol: Protocol): Promise<WorkItem[]> {
    const iterations = this.config.get<number>(PROTOCOLS_VALIDATION_ITERATIONS);
    const workItems: WorkItem[] = [];

    [...Array(iterations).keys()].forEach(() =>
      workItems.push(WorkItem.createProtocolValidationWorkItem(protocol)),
    );

    await this.worksItemsRepo.save(workItems);

    return workItems;
  }
}
