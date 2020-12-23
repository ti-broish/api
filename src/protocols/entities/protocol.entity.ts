import { Section } from '../../sections/entities';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryColumn } from "typeorm";
import { ulid } from 'ulid';
import { ProtocolAction } from './protocol-actions.entity';
import { ProtocolData } from './protocol-data.entity';
import { Picture } from 'src/pictures/entities/picture.entity';
import { ProtocolResult } from './protocol-result.entity';
import { User } from 'src/users/entities';

enum ProtocolStatus {
  RECEIVED = 'received',
  APPROVED = 'approved',
  REPLACED = 'replaced',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
};

enum ProtocolOrigin {
  TI_BROISH = 'ti-broish',
  CIK = 'cik',
};

@Entity('protocols')
export class Protocol {
  @PrimaryColumn('char', {
    length: 26,
  })
  id: string = ulid();

  @Column({ type: 'varchar' })
  origin: string = ProtocolOrigin.TI_BROISH;

  @Column({ type: 'varchar' })
  status: ProtocolStatus = ProtocolStatus.RECEIVED;

  @OneToOne(() => ProtocolData, data => data.protocol, {
    cascade: true,
  })
  data: ProtocolData|null;

  @ManyToOne(() => Section, section => section.protocols)
  section: Section;

  @ManyToMany(() => Picture, picture => picture.protocol)
  @JoinTable({
    name: 'protocols_pictures',
    joinColumn: { name: 'protocol_id' },
    inverseJoinColumn: { name: 'picture_id' },
  })
  pictures: Picture[];

  @OneToMany(() => ProtocolAction, action => action.protocol, {
    cascade: ['insert'],
  })
  actions: ProtocolAction[];

  @OneToMany(() => ProtocolResult, result => result.protocol)
  results: ProtocolResult[];

  @ManyToOne(() => Protocol)
  parent: Protocol;

  setReceivedStatus(sender: User): void {
    this.status = ProtocolStatus.RECEIVED;
    this.addAction(ProtocolAction.createSendAction(sender));
  }

  assign(assignee: User): void {
    this.addAction(ProtocolAction.createAsssignAction(assignee));
  }

  reject(actor: User): void {
    this.status = ProtocolStatus.REJECTED;
    this.addAction(ProtocolAction.createRejectAction(actor));
  }

  approve(actor: User): void {
    this.status = ProtocolStatus.APPROVED;
    this.addAction(ProtocolAction.createApproveAction(actor));
  }

  publish(): void {
    this.status = ProtocolStatus.PUBLISHED;
    this.addAction(ProtocolAction.createPublishAction());
  }

  replace(replacement: Protocol, actor: User): void {
    this.status = ProtocolStatus.REPLACED;
    this.parent = replacement;
    this.addAction(ProtocolAction.createReplaceAction(actor));
  }

  private addAction(action: ProtocolAction): void {
    action.protocol = this;
    this.actions = (this.actions || []).concat([action]);
  }

  addResults(...results: ProtocolResult[]): void {
    results.forEach(result => result.protocol = this);
    this.results = (this.results || []).concat(results);
  }

  setVotesData(data: ProtocolData, actor: User): void {
    data.protocol = this;
    this.data = data;
    this.addAction(ProtocolAction.createPopulateAction(actor));
  }
}
