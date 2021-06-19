import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Broadcast } from 'src/broadcasts/entities/broadcast.entity';
import { Party } from 'src/parties/entities/party.entity';
import { Picture } from 'src/pictures/entities/picture.entity';
import { Post } from 'src/posts/entities/post.entity';
import { ProtocolData } from 'src/protocols/entities/protocol-data.entity';
import { ProtocolResult } from 'src/protocols/entities/protocol-result.entity';
import { Protocol } from 'src/protocols/entities/protocol.entity';
import {
  CityRegion,
  Country,
  ElectionRegion,
  Municipality,
  Section,
  Town,
} from 'src/sections/entities';
import { Role } from 'src/casl/role.enum';
import { Violation } from 'src/violations/entities/violation.entity';
import { Organization, User } from '../users/entities';
import { Action } from './action.enum';
import { Client } from 'src/users/entities/client.entity';
import { Stream } from 'src/streams/entities/stream.entity';

type Subjects =
  | typeof User
  | typeof Organization
  | typeof Client
  | User
  | Organization
  | Client
  | typeof Post
  | typeof Broadcast
  | Post
  | Broadcast
  | typeof Picture
  | Picture
  | typeof Stream
  | Stream
  | typeof Protocol
  | typeof ProtocolData
  | typeof ProtocolResult
  | Protocol
  | ProtocolData
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
  | 'all';

type Actions =
  | Action.Read
  | Action.Update
  | Action.Create
  | Action.Manage
  | Action.Delete
  | Action.Publish;
export type AppAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<
      Ability<[Action, Subjects]>
    >(Ability as AbilityClass<AppAbility>);

    if (user.hasRole(Role.Admin)) {
      // read access to everything
      can(Action.Read, 'all');
      can([Action.Manage], User);
      can([Action.Create, Action.Update, Action.Publish], Post);
      // Delete only unpublished posts
      can(Action.Delete, Post, { publishAt: { $eq: null } });
      can([Action.Create, Action.Publish], Broadcast);
      // Change/Delete only unpublished broadcasts. Once the notifications are out, they're out.
      can([Action.Update, Action.Delete], Broadcast, {
        publishAt: { $eq: null },
      });
      can(Action.Update, User, [
        'email',
        'phone',
        'firstName',
        'lastName',
        'pin',
        'organization',
        'roles',
      ]);
    }

    if (user.hasRole(Role.Lawyer) || user.hasRole(Role.Admin)) {
      can(
        [Action.Read, Action.Update, Action.Publish, Action.Manage],
        Violation,
      );
      // Lawyers can access all protocols submitted to sections with violations
      can(Action.Read, [User, Picture, Protocol]);
    }

    if (user.hasRole(Role.Streamer) || user.hasRole(Role.Admin)) {
      can([Action.Create], Stream);
    }

    if (
      user.hasRole(Role.Validator) ||
      user.hasRole(Role.ExternalValidator) ||
      user.hasRole(Role.Admin)
    ) {
      can(Action.Read, [Protocol, ProtocolResult, ProtocolData]);
      can(Action.Create, [ProtocolResult, ProtocolData]);
      can(Action.Update, Protocol, ['status']);
      // Can see the organization of the user submitted the protocol
      can(Action.Read, User, ['organization']);
      // TODO: allow reading only the data of the submitter, not the organization of all users
      if (!user.hasRole(Role.ExternalValidator)) {
        can(Action.Publish, Protocol);
      } else {
        cannot(Action.Publish, Protocol).because(
          'External validators need another validator to review the protocol before publishing!',
        );
      }
    }

    // Check for the default role so we can revoke access to people
    if (user.hasRole(Role.User)) {
      can(Action.Read, Organization);
      can(Action.Read, [
        Section,
        CityRegion,
        Town,
        Municipality,
        ElectionRegion,
        Country,
      ]);
      can(Action.Create, [Picture, Protocol, ProtocolResult, Violation]);
      // TODO: Read own protocols and their status and actions taken
      // can(Action.Read, Protocol, { 'actions.actor.id': user.id, 'actions.type': ProtocolActionType.SEND });
      can(Action.Read, Party);
      can(Action.Read, Violation, { isPublished: true });
      // TODO: Read own violations and violation updates
      // can(Action.Read, Violation, { 'updates.actor.id': user.id });
      can([Action.Read, Action.Update], User, { id: user.id });
      // TODO: Disallow deleting own user account if protocols have been submitted
      can(Action.Delete, User, { id: user.id });
      can([Action.Read, Action.Create], Client, { owner: user });
    }

    return build();
  }
}
