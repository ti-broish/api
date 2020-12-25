import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { ulid } from 'ulid';
import { Section } from '../../sections/entities';
import { Picture } from '../../pictures/entities/picture.entity';
import { User } from '../../users/entities';
import { ReportUpdate, ReportUpdateType } from './report-update.entity';

export enum ReportStatus {
  RECEIVED = 'received',
  PROCESSING = 'processing',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
};

@Entity('reports')
export class Report {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar' })
  status: ReportStatus;

  @ManyToOne(() => Section, section => section.protocols)
  section: Section;

  @ManyToMany(() => Picture)
  @JoinTable({
    name: 'reports_pictures',
    joinColumn: { name: 'report_id' },
    inverseJoinColumn: { name: 'picture_id' },
  })
  pictures: Picture[];

  @OneToMany(() => ReportUpdate, (update: ReportUpdate) => update.report, {
    cascade: ['insert', 'update'],
  })
  updates: ReportUpdate[];

  getAuthor(): User {
    return this.updates.find((update: ReportUpdate) => update.type = ReportUpdateType.SEND).actor;
  }

  public getUpdates(): ReportUpdate[] {
    return this.updates || [];
  }

  setReceivedStatus(sender: User): void {
    if (this.status) {
      throw new Error('Report status cannot be set to received when not empty!');
    }
    this.status = ReportStatus.RECEIVED;
    this.addUpdate(ReportUpdate.createSendUpdate(sender));
  }

  assign(assignee: User): void {
    if (this.status !== ReportStatus.RECEIVED) {
      throw new Error('Report can be assigned only if in status received!');
    }
    this.status = ReportStatus.PROCESSING;
    this.addUpdate(ReportUpdate.createAsssignUpdate(assignee));
  }

  reject(actor: User): void {
    if (this.status !== ReportStatus.PROCESSING) {
      throw new Error('Report can be rejected only if it is in processing!');
    }

    this.status = ReportStatus.REJECTED;
    this.addUpdate(ReportUpdate.createRejectUpdate(actor));
  }

  accept(actor: User): void {
    if (this.status !== ReportStatus.PROCESSING) {
      throw new Error('Report can be accepted only if it is in processing!');
    }

    this.status = ReportStatus.ACCEPTED;
    this.addUpdate(ReportUpdate.createAcceptUpdate(actor));
  }

  publish(): void {
    if (this.status !== ReportStatus.ACCEPTED) {
      throw new Error('Report can be published only if it is approved!');
    }

    this.status = ReportStatus.PUBLISHED;
    this.addUpdate(ReportUpdate.createPublishUpdate());
  }

  private addUpdate(update: ReportUpdate): void {
    update.report = this;
    this.updates = (this.updates || []).concat([update]);
  }
}
