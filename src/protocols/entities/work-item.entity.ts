import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { Protocol } from './protocol.entity';
import { User } from '../../users/entities';

export enum WorkItemType {
  PROTOCOL_VALIDATION = 'protocol_validation',
  PROTOCOL_VALIDATION_DIFF_ARBITRAGE = 'protocol_validation_diff_arbitrage',
}

export enum WorkItemOrigin {
  PROTOCOL_RECEIVED = 'protocol_received',
  PROTOCOL_VALIDATION_DIFF = 'protocol_validation_diff',
}

// Last rank in the queue by having the highest position
const DEFAULT_POSITION = 0b1111111;

export const QUEUE_POSITION_TIERS = {
  HAS_NO_OTHER_VALIDATION_COMPLETED: 0b1000000,
  HAS_PROTOCOL_FROM_SAME_ELECTION_REGION: 0b0100000,
  HAS_PROTOCOL_FROM_SAME_COUNTRY_MUNICIPALITY: 0b0110000,
  HAS_PROTOCOL_FROM_SAME_CITY_REGION: 0b0111000,
  HAS_PROTOCOL_FROM_SAME_SECTION: 0b0111100,
  PROTOCOL_IS_FROM_A_MUNICIPALITY_TOWN: 0b0000010,
  PROTOCOL_IS_NOT_FROM_DB_ORG: 0b0000001,
};

@Entity('work_items', {
  orderBy: {
    queuePosition: 'ASC',
    id: 'ASC',
  },
})
export class WorkItem {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @Column({ type: 'varchar' })
  type: WorkItemType;

  @Column({ type: 'varchar' })
  origin: WorkItemOrigin;

  @ManyToOne(
    () => Protocol,
    (protocol: Protocol): WorkItem[] => protocol.workItems,
    { cascade: ['insert', 'update'] },
  )
  @JoinColumn({
    name: 'protocol_id',
  })
  protocol: Protocol;

  @ManyToOne(() => User, (user: User): WorkItem[] => user.assignedWorkItems)
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @Column()
  isAssigned: boolean;

  @Column()
  isComplete: boolean;

  @Column('bit')
  queuePosition: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column('timestamp')
  completedAt: Date;

  public static createProtocolValidationWorkItem(
    protocol: Protocol,
    queuePosition: number = DEFAULT_POSITION,
  ): WorkItem {
    if (!protocol.isReceived()) {
      throw new CannotAddProtocolToQueue(
        ERROR_CANNOT_ADD_PROTOCOL_TO_VALIDATION_QUEUE_IF_NOT_RECEIVED,
      );
    }

    const workItem = new WorkItem();
    workItem.type = WorkItemType.PROTOCOL_VALIDATION;
    workItem.origin = WorkItemOrigin.PROTOCOL_RECEIVED;
    workItem.protocol = protocol;
    workItem.setPosition(queuePosition);

    return workItem;
  }

  public static createProtocolValidationDiffArbitrageWorkItem(
    protocol: Protocol,
    queuePosition: number = DEFAULT_POSITION,
  ): WorkItem {
    if (!protocol.isSettled()) {
      throw new CannotAddProtocolToQueue(
        ERROR_CANNOT_ADD_PROTOCOL_TO_ARBITRATION_QUEUE_IF_NOT_SETTLED,
      );
    }

    const workItem = new WorkItem();
    workItem.type = WorkItemType.PROTOCOL_VALIDATION_DIFF_ARBITRAGE;
    workItem.origin = WorkItemOrigin.PROTOCOL_VALIDATION_DIFF;
    workItem.protocol = protocol;
    workItem.setPosition(queuePosition);

    return workItem;
  }

  assign(assignee: User): void {
    this.isAssigned = true;
    this.assignee = assignee;
    // Kept for auditing and backwards compatibility
    this.protocol.assign(assignee, [assignee]);
  }

  unassign(actor: User): void {
    if (!this.assignee) {
      throw new Error('Cannot unassign a work item without an assignee.');
    }

    const assigneeToBeRemoved = this.assignee;
    this.isAssigned = false;
    this.assignee = null;
    const assignees = this.protocol.assignees;
    const foundIndex = assignees.findIndex(
      (user: User) => user.id === assigneeToBeRemoved.id,
    );
    if (foundIndex >= 0) {
      assignees.splice(foundIndex, 1);
      this.protocol.assign(actor, assignees);
    }
  }

  private setPosition(position: number): void {
    this.queuePosition = position.toString(2);
  }
}

export class WorkQueueError extends Error {}
export class CannotAddProtocolToQueue extends WorkQueueError {}
const ERROR_CANNOT_ADD_PROTOCOL_TO_VALIDATION_QUEUE_IF_NOT_RECEIVED =
  'ERROR_CANNOT_ADD_PROTOCOL_TO_VALIDATION_QUEUE_IF_NOT_RECEIVED';
const ERROR_CANNOT_ADD_PROTOCOL_TO_ARBITRATION_QUEUE_IF_NOT_SETTLED =
  'ERROR_CANNOT_ADD_PROTOCOL_TO_ARBITRATION_QUEUE_IF_NOT_SETTLED';
