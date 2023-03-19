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
import { randomBytes } from 'crypto'
import { ProtocolAction, ProtocolActionType } from './protocol-action.entity'
import { ProtocolResult } from './protocol-result.entity'
import { Section } from '../../sections/entities'
import { Picture } from '../../pictures/entities/picture.entity'
import { User } from '../../users/entities'
import {
  ProtocolStatusException,
  ProtocolHasResultsException,
  ProtocolStatusConflictException,
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
  NOT_A_PROTOCOL = 'not-a-protocol',
  INCOMPLETE_PROTOCOL = 'incomplete-protocol',
}

export class ProtocolData {
  constructor(
    // Хартиен
    public hasPaperBallots?: boolean,
    // Хартиено-Машинен
    public machinesCount?: number,
    // Чернова/Оригинал
    public isFinal?: boolean,
    // 1. Брой на избирателите в избирателния списък при предаването му на СИК
    public votersCount?: number,
    // 2. Брой на избирателите, вписани в допълнителната страница (под чертата) на избирателния списък в изборния ден
    public additionalVotersCount?: number,
    // 3. Брой на гласувалите избиратели според положените подписи в избирателния списък, включително и подписите в допълнителната страница (под чертата)
    public votersVotedCount?: number,
    // 4. Хартиени бюлетини извън избирателната кутия
    // 4.а) брой на неизползваните хартиени бюлетини
    public uncastBallots?: number,
    // 4.б) общ брой на недействителните хартиени бюлетини по чл. 227, 228 и чл. 265, ал. 5, сгрешените бюлетини и унищожените от СИК бюлетини по други поводи (за създаване на образци за таблата пред изборното помещение и увредени механично при откъсване от кочана)
    public invalidAndUncastBallots?: number,
    // 5. Брой на намерените в избирателните кутии бюлетини
    // 5.(х) брой на намерените в избирателните кутии хартиени бюлетини
    public nonMachineCastBallotsCount?: number,
    // 5.(м) брой на намерените в избирателните кутии машинни бюлетини
    public machineCastBallotsCount?: number,
    // 5.(о) общ брой на намерените в избирателните кутии бюлетини
    public castBallotsCount?: number,
    // 6. Брой на недействителните гласове от хартиени бюлетини
    public invalidVotesCount?: number,
    // 7. Общ брой на всички действителни гласове (бюлетини)
    // 7.(х) Брой на всички действителни гласове с хартиени бюлетини
    public nonMachineVotesCount?: number,
    // 7.(м) Брой на всички действителни гласове с машинни бюлетини
    public machineVotesCount?: number,
    // 7.(o) Общ брой на всички действителни гласове (бюлетини)
    public validVotesCount?: number,
    // 7.1. Брой на действителните гласове, подадени за кандидатските листи на партии, коалиции и инициативни комитети
    // 7.1.(х) Брой на действителните гласове с хартиени бюлетини за кандидатски листи
    public partyNonMachineVotesCount?: number,
    // 7.1.(м) Брой на действителните гласове с машинни бюлетини за кандидатски листи
    public partyMachineVotesCount?: number,
    // 7.1.(о) Общ брой на действителните гласове за кандидатски листи
    public partyValidVotesCount?: number,
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

  @Column({ type: 'varchar' })
  secret: string

  @ManyToOne(() => Section, (section) => section.protocols, { eager: true })
  section?: Section

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
    { cascade: ['insert', 'update'] },
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

  public constructor() {
    this.secret = randomBytes(8).toString('base64')
  }

  public getResults(): ProtocolResult[] {
    return this.results || []
  }

  public getActions(): ProtocolAction[] {
    return this.actions || []
  }

  getAuthor(): User | null {
    return this.actions.find(
      (action: ProtocolAction) => action.action === ProtocolActionType.SEND,
    ).actor
  }

  getAuthorEmail(): string | null {
    const author = this.getAuthor()
    if (author !== null) {
      return author.email
    }

    return <string | null>(
      this.actions.find(
        (action: ProtocolAction) =>
          action.action === ProtocolActionType.SET_CONTACT,
      )?.payload.email
    )
  }

  isReceived(): boolean {
    return this.status === ProtocolStatus.RECEIVED
  }

  isSettled(): boolean {
    return this.status === ProtocolStatus.SETTLED
  }

  receive(sender?: User): void {
    if (this.status) {
      throw new ProtocolStatusException(this, ProtocolStatus.RECEIVED)
    }
    this.status = ProtocolStatus.RECEIVED
    this.addAction(ProtocolAction.createSendAction(sender))
  }

  setContact(contactEmail: string): void {
    if (!this.isReceived()) {
      throw new ProtocolStatusConflictException(this)
    }
    this.addAction(ProtocolAction.createSetContactAction(contactEmail))
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
