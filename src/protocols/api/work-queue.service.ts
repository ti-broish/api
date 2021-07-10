import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action } from 'src/casl/action.enum';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { User } from 'src/users/entities';
import { EntityNotFoundError } from 'typeorm';
import { Protocol } from '../entities/protocol.entity';
import {
  EmptyPersonalProtocolQueue,
  ProtocolsRepository,
} from '../entities/protocols.repository';
import {
  WorkItem,
  WorkItemType,
  WorkQueueError,
} from '../entities/work-item.entity';
import { WorkItemsRepository } from '../entities/work-items.repository';

const PROTOCOLS_VALIDATION_ITERATIONS = 'PROTOCOLS_VALIDATION_ITERATIONS';

export class WorkQueue {
  constructor(
    private readonly worksItemsRepo: WorkItemsRepository,
    private readonly protocolsRepo: ProtocolsRepository,
    @Inject(ConfigService) private readonly config: ConfigService,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async addProtocolForValidation(protocol: Protocol): Promise<WorkItem[]> {
    const iterations = this.config.get<number>(PROTOCOLS_VALIDATION_ITERATIONS);
    const workItems: WorkItem[] = [];

    [...Array(iterations).keys()].forEach(() =>
      workItems.push(WorkItem.createProtocolValidationWorkItem(protocol)),
    );

    await this.worksItemsRepo.save(workItems);

    return workItems;
  }

  async assign(workItem: WorkItem, assignee: User): Promise<WorkItem> {
    // Load all necessary protocol relations
    // They were not needed until now and speeds up finding the right work item
    workItem.protocol = await this.protocolsRepo.findOneOrFail(
      workItem.protocol.id,
    );

    workItem.assign(assignee);

    return await this.worksItemsRepo.save(workItem);
  }

  async retrieveItemForValidation(user: User): Promise<WorkItem | null> {
    let previouslyAssignedWorkItem: WorkItem | null = null;
    previouslyAssignedWorkItem = await this.getAssignedOpenWorkItem(user);

    // If already assigned to an open work item, don't look for a new one
    // Workers of the queue should either complete or abandon the work item they are assigned to
    if (previouslyAssignedWorkItem !== null) {
      return previouslyAssignedWorkItem;
    }

    return this.getAvailableWorkItemForValidation(user);
  }

  async unassignFromProtocol(
    actor: User,
    protocol: Protocol,
    assigneeToBeDeleted: User,
  ): Promise<void> {
    const workItem = await this.worksItemsRepo.findOne(
      protocol,
      assigneeToBeDeleted,
    );
    if (!workItem) {
      return;
    }

    workItem.protocol = protocol;
    workItem.unassign(actor);
    this.worksItemsRepo.save(workItem);
  }

  async completeItem(
    actor: User,
    protocol: Protocol,
    callback: Function = () => {},
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const workItem = await this.worksItemsRepo.findOne(protocol, actor);
      if (!workItem) {
        reject(new WorkItemNotFoundError('Work item not found!'));
      }

      workItem.protocol = protocol;
      workItem.complete();

      await callback();
      this.worksItemsRepo.save(workItem);
      resolve();
    });
  }

  private async getAvailableWorkItemForValidation(
    user: User,
  ): Promise<WorkItem> {
    const ability = this.caslAbilityFactory.createForUser(user);
    if (!ability.can(Action.Update, Protocol)) {
      throw new Error('User is not allowed to validate protocols!');
    }
    let workItem: WorkItem | null = null;

    try {
      workItem = await this.worksItemsRepo.findNextAvailableItem(user, [
        WorkItemType.PROTOCOL_VALIDATION,
      ]);
    } catch (error) {
      if (
        !(error instanceof EntityNotFoundError) &&
        !(error instanceof EmptyPersonalProtocolQueue)
      ) {
        throw error;
      }
    }

    return workItem;
  }

  private async getAssignedOpenWorkItem(user: User): Promise<WorkItem | null> {
    let workItem: WorkItem | null = null;

    try {
      workItem = await this.worksItemsRepo.findAssignedOpenItem(user);
    } catch (error) {
      if (!(error instanceof EntityNotFoundError)) {
        throw error;
      }
      return null;
    }

    return workItem;
  }
}

export class WorkItemNotFoundError extends WorkQueueError {}
