import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Broadcast } from '../entities/broadcast.entity';
import { BroadcastsRepository } from '../entities/broadcasts.repository';
import * as firebase from 'firebase-admin';
import { ClientsRepository } from 'src/users/entities/clients.repository';
import { Client } from 'src/users/entities/client.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class BroadcastsPublishTask {

  constructor(
    private readonly broadcastsRepo: BroadcastsRepository,
    private readonly clientsRepo: ClientsRepository,
    @InjectEntityManager() private entityManager: EntityManager
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'notifications',
    timeZone: process.env.TZ,
  })
  async triggerNotifications() {
    const broadcasts = await this.broadcastsRepo.findAllToBePublishedAndPending();
    broadcasts.forEach((broadcast: Broadcast) => {
      broadcast.process();
    });
    this.entityManager.save(broadcasts);
    const notifications = await Promise.all(broadcasts.map(async (broadcast: Broadcast) => this.convertBroadcastToNotification(broadcast)));
    try {
      // TODO: add proper logging with an external logger
      firebase.messaging().sendAll(notifications);
    } catch (error) {
      console.error(error);
    }
    broadcasts.forEach((broadcast: Broadcast) => {
      broadcast.publish();
    });
    this.entityManager.save(broadcasts);
  }

  private async convertBroadcastToNotification(broadcast: Broadcast): Promise<firebase.messaging.Message> {
    const message: any = {
      data: broadcast.data,
      notification: {
        title: broadcast.title,
        body: broadcast.contents,
      }
    };
    if (broadcast.users.length > 0) {
      const tokens = (await this.clientsRepo.findAllForOwners(broadcast.users)).map((client: Client) => client.token);
      message[tokens.length > 1 ? 'tokens' : 'token'] = tokens.length > 1 ? tokens : tokens[0];
    } else if (broadcast.topics.length === 1) {
      message.topic = broadcast.topics[0];
    } else if (broadcast.topics.length > 1) {
      message.condition = broadcast.topics.map((topic: string) => `'${topic}' in topics`).join(' && ');
    } else {
      throw new Error('Cannot determine neither tokens, nor topics nor condition for broadcast to notification conversion');
    }

    return message;
  }
}
