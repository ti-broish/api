import { forwardRef, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Action } from 'src/casl/action.enum'
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory'
import { SectionsRepository } from 'src/sections/entities/sections.repository'
import { User } from 'src/users/entities'
import { EntityNotFoundError, QueryRunner } from 'typeorm'
import { Protocol, ProtocolStatus } from '../entities/protocol.entity'
import {
  EmptyPersonalProtocolQueue,
  ProtocolsRepository,
} from '../entities/protocols.repository'
import {
  WorkItem,
  WorkItemType,
  WorkQueueError,
} from '../entities/work-item.entity'
import { WorkItemsRepository } from '../entities/work-items.repository'
import { ProtocolDto } from './protocol.dto'

const PROTOCOLS_VALIDATION_ITERATIONS = 'PROTOCOLS_VALIDATION_ITERATIONS'

export class WorkQueue {
  constructor(
    @Inject(forwardRef(() => WorkItemsRepository))
    private readonly workItemsRepo: WorkItemsRepository,
    @Inject(forwardRef(() => ProtocolsRepository))
    private readonly protocolsRepo: ProtocolsRepository,
    @Inject(forwardRef(() => SectionsRepository))
    private readonly sectionsRepo: SectionsRepository,
    @Inject(ConfigService) private readonly config: ConfigService,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async addProtocolForValidation(protocol: Protocol): Promise<WorkItem[]> {
    const iterations = this.config.get<number>(PROTOCOLS_VALIDATION_ITERATIONS)
    const workItems: WorkItem[] = []

    ;[...Array(iterations).keys()].forEach(() =>
      workItems.push(WorkItem.createProtocolValidationWorkItem(protocol)),
    )

    await this.workItemsRepo.save(workItems)

    return workItems
  }

  async addProtocolForArbitration(protocol: Protocol): Promise<WorkItem> {
    const workItem =
      WorkItem.createProtocolValidationDiffArbitrageWorkItem(protocol)
    await this.workItemsRepo.save(workItem)

    return workItem
  }

  async assignNextAvailableWorkItem(user: User): Promise<WorkItem | null> {
    let qr: QueryRunner = null
    try {
      qr = this.workItemsRepo.manager.connection.createQueryRunner()
      await qr.connect()
      await qr.startTransaction()
      const workItem = await this.retrieveItemForValidation(qr, user)
      if (workItem === null) {
        await qr.rollbackTransaction()
        return null
      }

      const result = await this.assign(qr, workItem, user)
      await qr.commitTransaction()
      return result
    } catch (e) {
      await qr.rollbackTransaction()
      throw e
    } finally {
      await qr.release()
    }
  }

  async assign(
    qr: QueryRunner,
    workItem: WorkItem,
    assignee: User,
  ): Promise<WorkItem> {
    // Load all necessary protocol relations
    // They were not needed until now and speeds up finding the right work item
    workItem.protocol = await this.protocolsRepo.findOneOrFail(
      workItem.protocol.id,
    )

    workItem.assign(assignee)

    return await qr.manager.save(workItem)
  }

  async retrieveItemForValidation(
    qr: QueryRunner,
    user: User,
  ): Promise<WorkItem | null> {
    let previouslyAssignedWorkItem: WorkItem | null = null
    previouslyAssignedWorkItem = await this.getAssignedOpenWorkItem(qr, user)

    // If already assigned to an open work item, don't look for a new one
    // Workers of the queue should either complete or abandon the work item they are assigned to
    if (previouslyAssignedWorkItem !== null) {
      return previouslyAssignedWorkItem
    }

    return this.getAvailableWorkItemForValidation(qr, user)
  }

  async unassignFromProtocol(
    actor: User,
    protocol: Protocol,
    assigneeToBeDeleted: User,
  ): Promise<void> {
    const workItem = await this.workItemsRepo.findOneByProtocolAndAssignee(
      protocol,
      assigneeToBeDeleted,
    )
    if (!workItem) {
      return
    }

    workItem.protocol = protocol
    workItem.unassign(actor)
    void this.workItemsRepo.save(workItem)
  }

  async completeItem(
    actor: User,
    protocol: Protocol,
    callback?: () => Promise<void>,
  ): Promise<WorkItem> {
    return new Promise(async (resolve, reject) => {
      const workItem = await this.workItemsRepo.findOneByProtocolAndAssignee(
        protocol,
        actor,
      )
      if (!workItem) {
        reject(new WorkItemNotFoundError('Work item not found!'))
        return
      }

      workItem.protocol = protocol
      workItem.complete()

      if (callback) {
        await callback()
      }
      await this.workItemsRepo.save(workItem)

      resolve(workItem)
    })
  }

  private async getAvailableWorkItemForValidation(
    qr: QueryRunner,
    user: User,
  ): Promise<WorkItem> {
    const ability = this.caslAbilityFactory.createForUser(user)
    if (!ability.can(Action.Update, Protocol)) {
      throw new Error('User is not allowed to validate protocols!')
    }
    let workItem: WorkItem | null = null

    const allowedWorkItemTypes = [WorkItemType.PROTOCOL_VALIDATION]

    if (ability.can(Action.Manage, Protocol)) {
      allowedWorkItemTypes.push(WorkItemType.PROTOCOL_VALIDATION_DIFF_ARBITRAGE)
    }

    try {
      workItem = await this.workItemsRepo.findNextAvailableItem(
        qr,
        user,
        allowedWorkItemTypes,
      )
    } catch (error) {
      if (
        !(error instanceof EntityNotFoundError) &&
        !(error instanceof EmptyPersonalProtocolQueue)
      ) {
        throw error
      }
    }

    return workItem
  }

  private async getAssignedOpenWorkItem(
    qr: QueryRunner,
    user: User,
  ): Promise<WorkItem | null> {
    let workItem: WorkItem | null = null

    try {
      workItem = await this.workItemsRepo.findAssignedOpenItem(qr, user)
    } catch (error) {
      if (!(error instanceof EntityNotFoundError)) {
        throw error
      }
      return null
    }

    return workItem
  }

  async checkResolution(
    actor: User,
    workItem: WorkItem,
    protocol: Protocol,
  ): Promise<void> {
    const ability = this.caslAbilityFactory.createForUser(actor)
    if (workItem.type === WorkItemType.PROTOCOL_VALIDATION_DIFF_ARBITRAGE) {
      if (ability.can(Action.Manage, Protocol)) {
        void this.actOnResolution(actor, protocol)
      }
      return
    }

    const other = await this.findOtherSettledProtocols(protocol)
    if (!other) {
      return
    }

    const hasAgreement = ProtocolDto.compare(protocol, other)

    if (!hasAgreement) {
      void this.addProtocolForArbitration(protocol.parent)

      return
    }

    void this.actOnResolution(actor, protocol)
  }

  private async actOnResolution(
    actor: User,
    protocol: Protocol,
  ): Promise<void> {
    if (protocol.status !== ProtocolStatus.READY) {
      // TODO: check rejection reason for follow-up notification to sender
      return
    }

    const hasPublishedProtocol = await this.sectionsRepo.hasPublishedProtocol(
      protocol.section,
    )

    if (hasPublishedProtocol) {
      protocol.approve(actor)
    } else {
      protocol.publish(actor)
    }

    void this.protocolsRepo.save(protocol)

    // TODO: Send notification to the sender the protocol was published
  }

  private async findOtherSettledProtocols(
    source: Protocol,
  ): Promise<Protocol | null> {
    if (!source.parent) {
      return null
    }

    return this.protocolsRepo.findSettledProtocolFromParent(source)
  }
}

export class WorkItemNotFoundError extends WorkQueueError {}
