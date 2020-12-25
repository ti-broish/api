import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ulid } from "ulid";
import { User } from '../../users/entities';
import { Report } from './report.entity';

export enum ReportUpdateType {
  SEND = 'send',
  ASSIGN = 'assign',
  REJECT = 'reject',
  ACCEPT = 'accept',
  PUBLISH = 'publish',
}

@Entity('report_updates')
export class ReportUpdate {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @ManyToOne(() => Report, report => report.updates)
  @JoinColumn({
    name: 'report_id',
  })
  report: Report;

  @ManyToOne(() => User)
  actor: User;

  @Column({ type: 'varchar' })
  type: ReportUpdateType;

  @Column({ type: 'json' })
  payload: object;

  @CreateDateColumn()
  timestamp: Date;

  public static createSendUpdate(actor: User): ReportUpdate {
    return ReportUpdate.create(ReportUpdateType.SEND, actor);
  }

  public static createAsssignUpdate(actor: User): ReportUpdate {
    return ReportUpdate.create(ReportUpdateType.ASSIGN, actor);
  }

  public static createRejectUpdate(actor: User): ReportUpdate {
    return ReportUpdate.create(ReportUpdateType.REJECT, actor);
  }

  public static createAcceptUpdate(actor: User): ReportUpdate {
    return ReportUpdate.create(ReportUpdateType.ACCEPT, actor);
  }

  public static createPublishUpdate(actor?: User): ReportUpdate {
    return ReportUpdate.create(ReportUpdateType.PUBLISH, actor);
  }

  private static create(updateType: ReportUpdateType, actor?: User): ReportUpdate {
    const update = new ReportUpdate();
    if (actor) {
      update.actor = actor;
    }
    update.type = updateType;

    return update;
  }
}
