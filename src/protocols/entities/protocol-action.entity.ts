import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'
import { ulid } from 'ulid'
import { Protocol } from './protocol.entity'
import { User } from '../../users/entities'

export enum ProtocolActionType {
  SEND = 'send',
  SET_CONTACT = 'contact',
  ASSIGN = 'assign',
  REJECT = 'reject',
  READY = 'ready',
  PUBLISH = 'publish',
  REPLACE = 'replace',
  APPROVE = 'approve',
}

@Entity('protocol_actions')
export class ProtocolAction {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid()

  @ManyToOne(() => Protocol, (protocol) => protocol.actions, { eager: true })
  @JoinColumn({
    name: 'protocol_id',
  })
  protocol: Protocol

  @ManyToOne(() => User)
  actor: User | null

  @Column({ type: 'varchar' })
  action: ProtocolActionType

  @Column({ type: 'json' })
  payload: Record<string, unknown>

  @CreateDateColumn()
  timestamp: Date

  public static createSendAction(actor?: User): ProtocolAction {
    return ProtocolAction.create(ProtocolActionType.SEND, actor)
  }

  public static createSetContactAction(email: string): ProtocolAction {
    return ProtocolAction.create(ProtocolActionType.SET_CONTACT, null, {
      email,
    })
  }

  public static createAsssignAction(
    actor: User,
    assignees: User[],
  ): ProtocolAction {
    return ProtocolAction.create(ProtocolActionType.ASSIGN, actor, {
      assignees: assignees.map((x) => x.id),
    })
  }

  public static createRejectAction(actor: User): ProtocolAction {
    return ProtocolAction.create(ProtocolActionType.REJECT, actor)
  }

  public static createPublishAction(actor: User): ProtocolAction {
    return ProtocolAction.create(ProtocolActionType.PUBLISH, actor)
  }

  public static createApprovedAction(actor: User): ProtocolAction {
    return ProtocolAction.create(ProtocolActionType.APPROVE, actor)
  }

  public static createReplaceAction(actor: User): ProtocolAction {
    return ProtocolAction.create(ProtocolActionType.REPLACE, actor)
  }

  public static createReadyAction(actor: User): ProtocolAction {
    return ProtocolAction.create(ProtocolActionType.READY, actor)
  }

  private static create(
    actionType: ProtocolActionType,
    actor?: User,
    payload?: Record<string, unknown>,
  ): ProtocolAction {
    const action = new ProtocolAction()
    if (actor) {
      action.actor = actor
    }
    action.action = actionType
    action.payload = payload

    return action
  }
}
