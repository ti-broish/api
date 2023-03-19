import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'
import { ulid } from 'ulid'
import { User } from '../../users/entities'
import { Violation } from './violation.entity'

export enum ViolationUpdateType {
  SEND = 'send',
  ASSIGN = 'assign',
  REJECT = 'reject',
  PROCESS = 'process',
  PUBLISH = 'publish',
  UNPUBLISH = 'unpublish',
}

@Entity('violation_updates')
export class ViolationUpdate {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid()

  @ManyToOne(() => Violation, (violation) => violation.updates)
  @JoinColumn({
    name: 'violation_id',
  })
  violation: Violation

  @ManyToOne(() => User)
  actor: User | null

  @Column({ type: 'varchar' })
  type: ViolationUpdateType

  @Column({ type: 'json' })
  payload: Record<string, unknown>

  @CreateDateColumn()
  timestamp: Date

  public static createSendUpdate(
    actor?: User,
    contact?: ViolationContact,
  ): ViolationUpdate {
    if (!actor && !contact) {
      throw new Error('Either actor or contact must be provided')
    }

    if (actor) {
      return ViolationUpdate.create(ViolationUpdateType.SEND, actor)
    }

    return ViolationUpdate.create(
      ViolationUpdateType.SEND,
      null,
      contact as unknown as Record<string, unknown>,
    )
  }

  public static createAsssignUpdate(
    actor: User,
    assignees: User[],
  ): ViolationUpdate {
    return ViolationUpdate.create(ViolationUpdateType.ASSIGN, actor, {
      assignees: assignees.map((x) => x.id),
    })
  }

  public static createRejectUpdate(actor: User): ViolationUpdate {
    return ViolationUpdate.create(ViolationUpdateType.REJECT, actor)
  }

  public static createProcessUpdate(actor: User): ViolationUpdate {
    return ViolationUpdate.create(ViolationUpdateType.PROCESS, actor)
  }

  public static createPublishUpdate(actor: User): ViolationUpdate {
    return ViolationUpdate.create(ViolationUpdateType.PUBLISH, actor)
  }

  public static createUnpublishUpdate(actor: User): ViolationUpdate {
    return ViolationUpdate.create(ViolationUpdateType.UNPUBLISH, actor)
  }

  private static create(
    updateType: ViolationUpdateType,
    actor?: User,
    payload?: Record<string, unknown>,
  ): ViolationUpdate {
    const update = new ViolationUpdate()
    if (actor) {
      update.actor = actor
    }
    update.type = updateType
    update.payload = payload

    return update
  }
}

export interface ViolationContact {
  name: string
  email: string
  phone: string
}

export class ViolationContact implements ViolationContact {
  name: string
  email: string
  phone: string
}
