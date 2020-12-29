import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ulid } from "ulid";
import { User } from '../../users/entities';
import { Violation } from './violation.entity';

export enum ViolationUpdateType {
  SEND = 'send',
  ASSIGN = 'assign',
  REJECT = 'reject',
  ACCEPT = 'accept',
  PUBLISH = 'publish',
}

@Entity('violation_updates')
export class ViolationUpdate {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @ManyToOne(() => Violation, violation => violation.updates)
  @JoinColumn({
    name: 'violation_id',
  })
  violation: Violation;

  @ManyToOne(() => User)
  actor: User;

  @Column({ type: 'varchar' })
  type: ViolationUpdateType;

  @Column({ type: 'json' })
  payload: object;

  @CreateDateColumn()
  timestamp: Date;

  public static createSendUpdate(actor: User): ViolationUpdate {
    return ViolationUpdate.create(ViolationUpdateType.SEND, actor);
  }

  public static createAsssignUpdate(actor: User): ViolationUpdate {
    return ViolationUpdate.create(ViolationUpdateType.ASSIGN, actor);
  }

  public static createRejectUpdate(actor: User): ViolationUpdate {
    return ViolationUpdate.create(ViolationUpdateType.REJECT, actor);
  }

  public static createAcceptUpdate(actor: User): ViolationUpdate {
    return ViolationUpdate.create(ViolationUpdateType.ACCEPT, actor);
  }

  public static createPublishUpdate(actor?: User): ViolationUpdate {
    return ViolationUpdate.create(ViolationUpdateType.PUBLISH, actor);
  }

  private static create(updateType: ViolationUpdateType, actor?: User): ViolationUpdate {
    const update = new ViolationUpdate();
    if (actor) {
      update.actor = actor;
    }
    update.type = updateType;

    return update;
  }
}
