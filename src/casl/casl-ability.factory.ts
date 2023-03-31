import {
  AbilityBuilder,
  ExtractSubjectType,
  FieldMatcher,
  InferSubjects,
  MatchConditions,
  PureAbility,
} from '@casl/ability'
import { Injectable } from '@nestjs/common'
import { Party } from 'src/parties/entities/party.entity'
import { Picture } from 'src/pictures/entities/picture.entity'
import { ProtocolResult } from 'src/protocols/entities/protocol-result.entity'
import { Protocol } from 'src/protocols/entities/protocol.entity'
import {
  CityRegion,
  Country,
  ElectionRegion,
  Municipality,
  Section,
  Town,
} from 'src/sections/entities'
import { Role } from 'src/casl/role.enum'
import { Violation } from 'src/violations/entities/violation.entity'
import { Organization, User } from '../users/entities'
import { Action } from './action.enum'
import { Client } from 'src/users/entities/client.entity'
import { Stream } from 'src/streams/entities/stream.entity'
import * as moment from 'moment'
import { ConfigService } from '@nestjs/config'

type Subjects =
  | typeof User
  | typeof Organization
  | typeof Client
  | User
  | Organization
  | Client
  | typeof Picture
  | Picture
  | typeof Stream
  | Stream
  | typeof Protocol
  | typeof ProtocolResult
  | Protocol
  | ProtocolResult
  | typeof Section
  | typeof CityRegion
  | typeof Town
  | typeof Municipality
  | typeof ElectionRegion
  | typeof Country
  | Section
  | CityRegion
  | Town
  | Municipality
  | ElectionRegion
  | Country
  | typeof Party
  | Party
  | typeof Violation
  | Violation
  | 'all'

type Actions =
  | Action.Read
  | Action.Update
  | Action.Create
  | Action.Manage
  | Action.Delete
  | Action.Publish

export type AppAbility = PureAbility<[Actions, Subjects], MatchConditions>

const lambdaMatcher = (matchConditions: MatchConditions) => matchConditions
const detectSubjectType = (object: object) =>
  object.constructor as ExtractSubjectType<InferSubjects<Subjects>>
const fieldMatcher: FieldMatcher = (fields) => (field) => fields.includes(field)

@Injectable()
export class CaslAbilityFactory {
  constructor(private readonly config: ConfigService) {}

  createForUser(user: User | undefined): AppAbility {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { can, build } = new AbilityBuilder<AppAbility>(PureAbility)

    // Unauthenticated users can read organisations, sections, localities and parties
    can(Action.Read, [
      Organization,
      Section,
      CityRegion,
      Town,
      Municipality,
      ElectionRegion,
      Country,
      Party,
      Picture,
    ])
    // Unauthenticated users can send pictures and violations with pictures
    can(Action.Create, [Picture, Protocol, Violation])
    // Unauthenticated users can see published violations and protocols
    can(Action.Read, Violation, (violation: Violation) => violation.isPublished)
    can(Action.Read, Protocol, (protocol: Protocol) => protocol.isPublished())

    // If user is unauthenticated stop adding abilities
    if (user === undefined) {
      return build({
        conditionsMatcher: lambdaMatcher,
        detectSubjectType,
        fieldMatcher,
      })
    }

    if (user.hasRole(Role.Admin)) {
      // read access to everything
      can(Action.Read, 'all')
      can(Action.Manage, [User, Protocol, Section])
      can(Action.Update, User, [
        'email',
        'phone',
        'firstName',
        'lastName',
        'pin',
        'organization',
        'roles',
      ])
    }

    if (user.hasRole(Role.Lawyer) || user.hasRole(Role.Admin)) {
      can(
        [Action.Read, Action.Update, Action.Publish, Action.Manage],
        Violation,
      )
      // Lawyers can access all protocols submitted to sections with violations
      can(Action.Read, [User, Picture, Protocol])
    }

    const currentTime = moment().format()
    const limitTimestamp = moment.parseZone(
      this.config.get<string>('STREAMING_TIMESTAMP'),
    )

    if (
      (user.hasRole(Role.Streamer) &&
        moment(currentTime).isAfter(limitTimestamp, 'second')) ||
      user.hasRole(Role.Admin)
    ) {
      can([Action.Create], Stream)
    }

    if (user.hasRole(Role.StreamModerator) || user.hasRole(Role.Admin)) {
      can([Action.Manage], Stream)
    }

    if (user.hasRole(Role.Validator) || user.hasRole(Role.Admin)) {
      can(Action.Read, [Protocol, ProtocolResult])
      can(Action.Create, [ProtocolResult])
      can(Action.Update, Protocol)
      // Can see the organization of the user submitted the protocol
      can(Action.Read, User, ['organization'])
      // TODO: allow reading only the data of the submitter, not the organization of all users
      can(Action.Publish, Protocol)
      // Can create sections in existing localities when validating protocols
      can(Action.Create, Section)
    }

    if (user.hasRole(Role.SuperValidator) || user.hasRole(Role.Admin)) {
      can(Action.Manage, [Protocol])
    }

    // Check for the default role so we can revoke access to people
    if (user.hasRole(Role.User)) {
      // TODO: Read own protocols and their status and actions taken
      // can(Action.Read, Protocol, { 'actions.actor.id': user.id, 'actions.type': ProtocolActionType.SEND });
      // TODO: Read own violations and violation updates
      // can(Action.Read, Violation, { 'updates.actor.id': user.id });
      can([Action.Read, Action.Update], User, (x: User) => x.id === user.id)
      // TODO: Disallow deleting own user account if protocols have been submitted
      can(Action.Delete, User, (x: User) => x.id === user.id)
      can(
        [Action.Read, Action.Create],
        Client,
        (x: Client) => x.owner.id === user.id,
      )
    }

    return build({
      conditionsMatcher: lambdaMatcher,
      detectSubjectType,
      fieldMatcher,
    })
  }
}
