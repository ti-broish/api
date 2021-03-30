import { AfterLoad, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { ulid } from 'ulid';
import { ProtocolAction, ProtocolActionType } from './protocol-action.entity';
import { ProtocolData } from './protocol-data.entity';
import { ProtocolResult } from './protocol-result.entity';
import { Section } from '../../sections/entities';
import { Picture } from '../../pictures/entities/picture.entity';
import { User } from '../../users/entities';
import { ProtocolStatusException, ProtocolHasResultsException } from './protocol.exceptions';

export enum ProtocolStatus {
  RECEIVED = 'received',
  REJECTED = 'rejected',
  REPLACED = 'replaced',
  READY = 'ready',
  APPROVED = 'approved',
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

  @ManyToMany(() => Picture, {
    cascade: ['insert', 'update']
  })
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
    return this.actions.find((action: ProtocolAction) => action.action === ProtocolActionType.SEND).actor;
  }

  setReceivedStatus(sender: User): void {
    if (this.status) {
      throw new ProtocolStatusException(this, ProtocolStatus.RECEIVED);
    }
    this.status = ProtocolStatus.RECEIVED;
    this.addAction(ProtocolAction.createSendAction(sender));
  }

  assign(actor: User, assignees: User[]): void {
    this.assignees = assignees;
    this.addAction(ProtocolAction.createAsssignAction(actor, assignees));
  }

  populate(actor: User, results: ProtocolResult[]): void {
    if (this.hasResults()) {
      throw new ProtocolHasResultsException(this);
    }
    this.setResults(results);
    this.addAction(ProtocolAction.createPopulateAction(actor));
  }

  reject(actor: User): void {
    if (this.status !== ProtocolStatus.RECEIVED) {
      throw new ProtocolStatusException(this, ProtocolStatus.REJECTED);
    }

    this.status = ProtocolStatus.REJECTED;
    this.addAction(ProtocolAction.createRejectAction(actor));
  }

  approve(actor: User): void {
    if (this.status !== ProtocolStatus.RECEIVED) {
      throw new ProtocolStatusException(this, ProtocolStatus.APPROVED);
    }

    this.status = ProtocolStatus.APPROVED;
    this.addAction(ProtocolAction.createApproveAction(actor));
  }

  publish(): void {
    if (this.status !== ProtocolStatus.APPROVED) {
      throw new ProtocolStatusException(this, ProtocolStatus.PUBLISHED);
    }

    this.status = ProtocolStatus.PUBLISHED;
    this.addAction(ProtocolAction.createPublishAction());
  }

  replace(actor: User, section: Section|null, protocolResults: ProtocolResult[], protocolData: ProtocolData): Protocol {
    if (![
      ProtocolStatus.RECEIVED,
      ProtocolStatus.APPROVED,
      ProtocolStatus.READY,
      ProtocolStatus.PUBLISHED,
    ].includes(this.status)) {
      throw new ProtocolStatusException(this, ProtocolStatus.REPLACED);
    }
    const replacement = new Protocol();
    replacement.results = protocolResults;
    replacement.data = protocolData;
    replacement.section = section || this.section;
    replacement.status = ProtocolStatus.READY;
    replacement.pictures = this.pictures;
    replacement.assignees = this.assignees;

    this.status = ProtocolStatus.REPLACED;
    this.parent = replacement;
    this.addAction(ProtocolAction.createReplaceAction(actor));

    return replacement;
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
      throw new ProtocolHasResultsException(this);
    }
    results.forEach(result => result.protocol = this);
    this.results = results;
  }

  private setData(data: ProtocolData): void {
    data.protocol = this;
    this.data = data;
  }

  @AfterLoad()
  sortAttributes() {
    if (this?.pictures?.length) {
      this.pictures.sort((a, b) => Math.sign(a.sortPosition - b.sortPosition));
    }
  }
}
