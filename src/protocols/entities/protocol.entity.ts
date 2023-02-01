import {
  AfterLoad,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm'
import { ulid } from 'ulid'
import { ProtocolAction, ProtocolActionType } from './protocol-action.entity'
import { ProtocolResult } from './protocol-result.entity'
import { Section } from '../../sections/entities'
import { Picture } from '../../pictures/entities/picture.entity'
import { User } from '../../users/entities'
import {
  ProtocolStatusException,
  ProtocolHasResultsException,
} from './protocol.exceptions'
import { WorkItem } from './work-item.entity'

export enum ProtocolStatus {
  RECEIVED = 'received',
  SETTLED = 'settled',
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

export enum ProtocolRejectionReason {
  INCOMPLETE_PAPER_PROTOCOL = 'incomplete-paper-protocol',
  INCOMPLETE_PAPER_MACHINE_PROTOCOL = 'incomplete-paper-machine-protocol',
  MALICE_INPUT = 'malice-input',
  REJECTION_WITH_NO_NOTIFICATION = 'rejection-with-no-notification',
}

export class ProtocolData {
  constructor(
    public hasPaperBallots?: boolean,
    public machinesCount?: number,
    public isFinal?: boolean,
    public votersCount?: number,
    public additionalVotersCount?: number,
    public votersVotedCount?: number,
    public uncastBallots?: number,
    public invalidAndUncastBallots?: number,
    public totalVotesCast?: number,
    public nonMachineVotesCount?: number,
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
  id: string = ulid()

  @Column({ type: 'varchar' })
  origin: string = ProtocolOrigin.TI_BROISH

  @Column({ type: 'varchar' })
  status: ProtocolStatus

  @Column({ type: 'varchar' })
  rejectionReason: ProtocolRejectionReason

  @Column('jsonb')
  metadata: ProtocolData

  @ManyToOne(() => Section, (section) => section.protocols, { eager: true })
  section: Section

  @ManyToMany(() => Picture, {
    cascade: ['insert', 'update'],
  })
  @JoinTable({
    name: 'protocols_pictures',
    joinColumn: { name: 'protocol_id' },
    inverseJoinColumn: { name: 'picture_id' },
  })
  pictures: Picture[]

  @ManyToMany(() => User)
  @JoinTable({
    name: 'protocols_assignees',
    joinColumn: { name: 'protocol_id' },
    inverseJoinColumn: { name: 'assignee_id' },
  })
  assignees: User[]

  @OneToMany(
    () => ProtocolAction,
    (action: ProtocolAction) => action.protocol,
    {
      cascade: ['insert', 'update'],
    },
  )
  actions: ProtocolAction[]

  @OneToMany(
    () => ProtocolResult,
    (result: ProtocolResult) => result.protocol,
    {
      cascade: ['insert', 'update'],
    },
  )
  results: ProtocolResult[]

  @OneToMany(
    () => WorkItem,
    (workItem: WorkItem): Protocol => workItem.protocol,
  )
  workItems: WorkItem[]

  @ManyToOne(
    () => Protocol,
    (protocol: Protocol): Protocol[] => protocol.children,
    {
      cascade: ['insert', 'update'],
    },
  )
  parent: Protocol

  @OneToMany(() => Protocol, (protocol: Protocol): Protocol => protocol.parent)
  children: Protocol[]

  public getResults(): ProtocolResult[] {
    return this.results || []
  }

  public getActions(): ProtocolAction[] {
    return this.actions || []
  }

  getAuthor(): User {
    return this.actions.find(
      (action: ProtocolAction) => action.action === ProtocolActionType.SEND,
    ).actor
  }

  isReceived(): boolean {
    return this.status === ProtocolStatus.RECEIVED
  }

  isSettled(): boolean {
    return this.status === ProtocolStatus.SETTLED
  }

  receive(sender: User): void {
    if (this.status) {
      throw new ProtocolStatusException(this, ProtocolStatus.RECEIVED)
    }
    this.status = ProtocolStatus.RECEIVED
    this.addAction(ProtocolAction.createSendAction(sender))
  }

  assign(actor: User, assignees: User[]): void {
    this.assignees = assignees
    this.addAction(ProtocolAction.createAsssignAction(actor, assignees))
  }

  reject(actor: User, reason: ProtocolRejectionReason): Protocol {
    if (!this.isReceived() && !this.isSettled()) {
      throw new ProtocolStatusException(this, ProtocolStatus.REJECTED)
    }

    const replacement = new Protocol()
    replacement.receive(actor)
    replacement.section = this.section
    replacement.pictures = this.pictures
    replacement.status = ProtocolStatus.REJECTED
    replacement.addAction(ProtocolAction.createRejectAction(actor))
    replacement.assignees = [actor]
    replacement.parent = this
    replacement.rejectionReason = reason

    this.status = ProtocolStatus.SETTLED
    this.addAction(ProtocolAction.createRejectAction(actor))

    return replacement
  }

  publish(actor: User): void {
    if (this.status !== ProtocolStatus.READY) {
      throw new ProtocolStatusException(this, ProtocolStatus.PUBLISHED)
    }

    this.status = ProtocolStatus.PUBLISHED
    this.addAction(ProtocolAction.createPublishAction(actor))
  }

  approve(actor: User): void {
    if (this.status !== ProtocolStatus.READY) {
      throw new ProtocolStatusException(this, ProtocolStatus.APPROVED)
    }

    this.status = ProtocolStatus.APPROVED
    this.addAction(ProtocolAction.createApprovedAction(actor))
  }

  replace(actor: User, replacement: Protocol): Protocol {
    if (
      ![
        ProtocolStatus.RECEIVED,
        ProtocolStatus.SETTLED,
        ProtocolStatus.PUBLISHED,
      ].includes(this.status)
    ) {
      throw new ProtocolStatusException(this, ProtocolStatus.REPLACED)
    }
    replacement.receive(actor)
    replacement.section = replacement.section || this.section
    replacement.status = ProtocolStatus.READY
    replacement.addAction(ProtocolAction.createReadyAction(actor))
    replacement.assignees = this.assignees
    replacement.parent = this

    this.status = ProtocolStatus.SETTLED
    this.addAction(ProtocolAction.createReplaceAction(actor))

    return replacement
  }

  hasResults(): boolean {
    return this.results.length > 0
  }

  private addAction(action: ProtocolAction): void {
    action.protocol = this
    this.actions = (this.actions || []).concat([action])
  }

  private setResults(results: ProtocolResult[]): void {
    if (this.getResults().length > 0) {
      throw new ProtocolHasResultsException(this)
    }
    results.forEach((result) => (result.protocol = this))
    this.results = results
  }

  setData(data: ProtocolData): void {
    this.metadata = data
  }

  @AfterLoad()
  sortAttributes() {
    if (this?.pictures?.length) {
      this.pictures.sort((a, b) => Math.sign(a.sortPosition - b.sortPosition))
    }

    if (this?.results?.length) {
      this.results.sort((a, b) => Math.sign(a?.party?.id - b?.party?.id))
    }
  }
}
