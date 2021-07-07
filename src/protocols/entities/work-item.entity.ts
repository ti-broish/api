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
  )
  @JoinColumn({
    name: 'protocol_id',
  })
  protocol: Protocol;

  @ManyToOne(() => User, (user: User): WorkItem[] => user.assignedWorkItems)
  assignee: User;

  @Column()
  isAssigned: boolean;

  @Column()
  isComplete: boolean;

  @Column('bit')
  queuePosition: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column('timestamp')
  completedAt: Date;

  public static create(
    type: WorkItemType,
    origin: WorkItemOrigin,
    protocol: Protocol,
    queuePosition: number = DEFAULT_POSITION,
  ): WorkItem {
    const workItem = new WorkItem();
    workItem.type = type;
    workItem.origin = origin;
    workItem.protocol = protocol;
    workItem.queuePosition = queuePosition;

    return workItem;
  }
}
