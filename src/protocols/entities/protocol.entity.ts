import {
  AfterLoad,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { ProtocolAction, ProtocolActionType } from './protocol-action.entity';
import { ProtocolResult } from './protocol-result.entity';
import { Section } from '../../sections/entities';
import { Picture } from '../../pictures/entities/picture.entity';
import { User } from '../../users/entities';
import {
  ProtocolStatusException,
  ProtocolHasResultsException,
} from './protocol.exceptions';
import { WorkItem } from './work-item.entity';

export enum ProtocolStatus {
  RECEIVED = 'received',
  REJECTED = 'rejected',
  REPLACED = 'replaced',
  READY = 'ready',
  APPROVED = 'approved',
  PUBLISHED = 'published',
}

export enum ProtocolOrigin {
  TI_BROISH = 'ti-broish',
  CIK = 'cik',
}

export class ProtocolData {
  constructor(
    public hasPaperBallots?: boolean,
    public machinesCount?: number,
    public isFinal?: boolean,
    public votersCount?: number,
    public additionalVotersCount?: number,
    public paperBallotsOutsideOfBox?: number,
    public votesCount?: number,
    public paperVotesCount?: number,
    public machineVotesCount?: number,
    public invalidVotesCount?: number,
    public validVotesCount?: number,
  ) {}
}

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

  @Column('jsonb')
  metadata: ProtocolData;

  @ManyToOne(() => Section, (section) => section.protocols, { eager: true })
  section: Section;

  @ManyToMany(() => Picture, {
    cascade: ['insert', 'update'],
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

  @OneToMany(
    () => ProtocolAction,
    (action: ProtocolAction) => action.protocol,
    {
      cascade: ['insert', 'update'],
    },
  )
  actions: ProtocolAction[];

  @OneToMany(
    () => ProtocolResult,
    (result: ProtocolResult) => result.protocol,
    {
      cascade: ['insert', 'update'],
    },
  )
  results: ProtocolResult[];

  @OneToMany(
    () => WorkItem,
    (workItem: WorkItem): Protocol => workItem.protocol,
  )
  workItems: WorkItem[];

  @ManyToOne(() => Protocol, {
    cascade: ['insert', 'update'],
  })
  parent: Protocol;

  public getResults(): ProtocolResult[] {
    return this.results || [];
  }

  public getActions(): ProtocolAction[] {
    return this.actions || [];
  }

  getAuthor(): User {
    return this.actions.find(
      (action: ProtocolAction) => action.action === ProtocolActionType.SEND,
    ).actor;
  }

  isReceived(): boolean {
    return this.status === ProtocolStatus.RECEIVED;
  }

  isSettled(): boolean {
    return this.status !== ProtocolStatus.RECEIVED;
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

  reject(actor: User): void {
    if (!this.isReceived()) {
      throw new ProtocolStatusException(this, ProtocolStatus.REJECTED);
    }

    this.status = ProtocolStatus.REJECTED;
    this.addAction(ProtocolAction.createRejectAction(actor));
  }

  approve(actor: User): void {
    if (!this.isReceived()) {
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

  replace(
    actor: User,
    replacement: Protocol,
    replacementStatus: ProtocolStatus = ProtocolStatus.PUBLISHED,
  ): Protocol {
    if (
      ![
        ProtocolStatus.RECEIVED,
        ProtocolStatus.APPROVED,
        ProtocolStatus.READY,
        ProtocolStatus.PUBLISHED,
      ].includes(this.status)
    ) {
      throw new ProtocolStatusException(this, ProtocolStatus.REPLACED);
    }
    replacement.setReceivedStatus(actor);
    replacement.section = replacement.section || this.section;
    replacement.status = replacementStatus;
    replacement.assignees = this.assignees;

    this.status = ProtocolStatus.REPLACED;
    this.parent = replacement;
    this.addAction(ProtocolAction.createPublishAction(actor));

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
    results.forEach((result) => (result.protocol = this));
    this.results = results;
  }

  setData(data: ProtocolData): void {
    this.metadata = data;
  }

  @AfterLoad()
  sortAttributes() {
    if (this?.pictures?.length) {
      this.pictures.sort((a, b) => Math.sign(a.sortPosition - b.sortPosition));
    }

    if (this?.results?.length) {
      this.results.sort((a, b) => Math.sign(a?.party?.id - b?.party?.id));
    }
  }
}
