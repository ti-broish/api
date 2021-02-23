import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { ulid } from 'ulid';
import { ProtocolAction, ProtocolActionType } from './protocol-action.entity';
import { ProtocolData } from './protocol-data.entity';
import { ProtocolResult } from './protocol-result.entity';
import { Section } from '../../sections/entities';
import { Picture } from '../../pictures/entities/picture.entity';
import { User } from '../../users/entities';
import { ProtocolHasResultsException } from './protocol-has-results.exception';

export enum ProtocolStatus {
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
  status: ProtocolStatus;

  @OneToOne(() => ProtocolData, data => data.protocol, {
    cascade: ['insert', 'update'],
  })
  data: ProtocolData|null;

  @ManyToOne(() => Section, section => section.protocols, { eager: true })
  section: Section;

  @ManyToMany(() => Picture)
  @JoinTable({
    name: 'protocols_pictures',
    joinColumn: { name: 'protocol_id' },
    inverseJoinColumn: { name: 'picture_id' },
  })
  pictures: Picture[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'protocols_assignees',
    joinColumn: { name: 'protocol_id' },
    inverseJoinColumn: { name: 'assignee_id' },
  })
  assignees: User[];

  @OneToMany(() => ProtocolAction, (action: ProtocolAction) => action.protocol, {
    cascade: ['insert', 'update'],
  })
  actions: ProtocolAction[];

  @OneToMany(() => ProtocolResult, (result: ProtocolResult) => result.protocol, {
    cascade: ['insert', 'update'],
  })
  results: ProtocolResult[];

  @ManyToOne(() => Protocol)
  parent: Protocol;

  public getResults(): ProtocolResult[] {
    return this.results || [];
  }

  public getActions(): ProtocolAction[] {
    return this.actions || [];
  }

  getAuthor(): User {
    return this.actions.find((action: ProtocolAction) => action.action = ProtocolActionType.SEND).actor;
  }

  setReceivedStatus(sender: User): void {
    if (this.status) {
      throw new Error('Protocol status cannot be set to received when not empty!');
    }
    this.status = ProtocolStatus.RECEIVED;
    this.addAction(ProtocolAction.createSendAction(sender));
  }

  assign(actor: User, assignees: User[]): void {
    this.assignees = assignees;
    this.addAction(ProtocolAction.createAsssignAction(actor, assignees));
  }

  populate(actor: User, results: ProtocolResult[], votesData?: ProtocolData): void {
    if (this.hasResults()) {
      throw new ProtocolHasResultsException(this);
    }
    this.setResults(results);
    this.setVotesData(votesData);
    this.addAction(ProtocolAction.createPopulateAction(actor));
  }

  reject(actor: User): void {
    if (this.status !== ProtocolStatus.RECEIVED) {
      throw new Error('Protocol status can be set to rejected only if it is received!');
    }

    this.status = ProtocolStatus.REJECTED;
    this.addAction(ProtocolAction.createRejectAction(actor));
  }

  approve(actor: User): void {
    if (this.status !== ProtocolStatus.RECEIVED) {
      throw new Error('Protocol status can be set to approved only if it is received!');
    }

    this.status = ProtocolStatus.APPROVED;
    this.addAction(ProtocolAction.createApproveAction(actor));
  }

  publish(): void {
    if (this.status !== ProtocolStatus.APPROVED) {
      throw new Error('Protocol status can be set to published only if it is approved!');
    }

    this.status = ProtocolStatus.PUBLISHED;
    this.addAction(ProtocolAction.createPublishAction());
  }

  replace(replacement: Protocol, actor: User): void {
    if ([ProtocolStatus.RECEIVED, ProtocolStatus.APPROVED, ProtocolStatus.PUBLISHED]) {
      throw new Error('Protocol status cannot be replaced!');
    }

    this.status = ProtocolStatus.REPLACED;
    this.parent = replacement;
    this.addAction(ProtocolAction.createReplaceAction(actor));
  }

  hasResults(): boolean {
    return this.results.length > 0;
  }

  private addAction(action: ProtocolAction): void {
    action.protocol = this;
    this.actions = (this.actions || []).concat([action]);
  }

  private setResults(results: ProtocolResult[]): void {
    if (this.getResults().length > 0) {
      throw new Error('Cannot set results on an populated protocol!');
    }
    results.forEach(result => result.protocol = this);
    this.results = results;
  }

  private setVotesData(data: ProtocolData): void {
    data.protocol = this;
    this.data = data;
  }
}
