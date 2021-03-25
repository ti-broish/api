import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { ulid } from 'ulid';
import { Section, Town } from '../../sections/entities';
import { Picture } from '../../pictures/entities/picture.entity';
import { User } from '../../users/entities';
import { ViolationUpdate, ViolationUpdateType } from './violation-update.entity';
import { ViolationComment } from './violation-comment.entity';

export enum ViolationStatus {
  RECEIVED = 'received',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  REJECTED = 'rejected',
};

@Entity('violations')
export class Violation {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar' })
  status: ViolationStatus;

  @Column({ type: 'boolean' })
  isPublished: boolean;

  @ManyToOne(() => Section, section => section.violations)
  section?: Section;

  @ManyToOne(() => Town, town => town.violations)
  town: Town;

  @ManyToMany(() => Picture)
  @JoinTable({
    name: 'violations_pictures',
    joinColumn: { name: 'violation_id' },
    inverseJoinColumn: { name: 'picture_id' },
  })
  pictures: Picture[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'violations_assignees',
    joinColumn: { name: 'violation_id' },
    inverseJoinColumn: { name: 'assignee_id' },
  })
  assignees: User[];

  @OneToMany(() => ViolationUpdate, (update: ViolationUpdate) => update.violation, {
    cascade: ['insert', 'update'],
  })
  updates: ViolationUpdate[];

  @OneToMany(() => ViolationComment, (comment: ViolationComment) => comment.violation, {
    cascade: ['update'],
  })
  comments: ViolationComment[];

  getAuthor(): User {
    return this.updates.find((update: ViolationUpdate) => update.type = ViolationUpdateType.SEND).actor;
  }

  public getUpdates(): ViolationUpdate[] {
    return this.updates || [];
  }

  setReceivedStatus(sender: User): void {
    if (this.status) {
      throw new Error('Violation status cannot be set to received when not empty!');
    }
    this.status = ViolationStatus.RECEIVED;
    this.addUpdate(ViolationUpdate.createSendUpdate(sender));
  }

  assign(actor: User, assignees: User[]): void {
    if (this.status === ViolationStatus.RECEIVED) {
      this.status = ViolationStatus.PROCESSING;
    }
    this.assignees = assignees;
    this.addUpdate(ViolationUpdate.createAsssignUpdate(actor, assignees));
  }

  reject(actor: User): void {
    if (this.status !== ViolationStatus.PROCESSING) {
      throw new Error('Violation can be rejected only if it is in processing!');
    }

    this.status = ViolationStatus.REJECTED;
    this.addUpdate(ViolationUpdate.createRejectUpdate(actor));
  }

  process(actor: User): void {
    if (this.status !== ViolationStatus.PROCESSING) {
      throw new Error('Violation can be processed only if it is in processing!');
    }

    this.status = ViolationStatus.PROCESSED;
    this.addUpdate(ViolationUpdate.createProcessUpdate(actor));
  }

  publish(): void {
    if (![ViolationStatus.PROCESSING, ViolationStatus.PROCESSED]) {
      throw new Error('Violation can be published only if it is in processing or processed!');
    }

    if (this.isPublished) {
      throw new Error('You cannot publish an already published violation!');
    }

    this.isPublished = true;
    this.addUpdate(ViolationUpdate.createPublishUpdate());
  }

  unpublish(): void {
    if (!this.isPublished) {
      throw new Error('Violation is not published!');
    }

    this.isPublished = false;
    this.addUpdate(ViolationUpdate.createUnpublishUpdate());
  }

  private addUpdate(update: ViolationUpdate): void {
    update.violation = this;
    this.updates = (this.updates || []).concat([update]);
  }
}
