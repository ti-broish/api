import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import * as dateformat from 'dateformat';
import { Broadcast, BroadcastStatus } from './broadcast.entity';

@Injectable()
export class BroadcastsRepository {
  constructor(
    @InjectRepository(Broadcast)
    private repo: Repository<Broadcast>,
  ) {}

  findOne(id: number): Promise<Broadcast | undefined> {
    return this.repo.findOne(id);
  }

  findOneOrFail(id: number): Promise<Broadcast> {
    return this.repo.findOneOrFail(id);
  }

  findAll(): Promise<Broadcast[]> {
    return this.repo.find({
      relations: ['users'],
    });
  }

  findAllToBePublishedAndPending(
    publishedBeforeDate?: Date,
  ): Promise<Broadcast[]> {
    if (publishedBeforeDate === undefined) {
      publishedBeforeDate = new Date();
    }
    const date = dateformat(publishedBeforeDate, "yyyy-mm-dd' 'HH:MM:ss");

    return this.repo.find({
      relations: ['users'],
      where: {
        publishAt: Raw((alias) => `${alias} <= :date`, { date }),
        status: BroadcastStatus.PENDING,
      },
      order: {
        publishAt: 'ASC',
      },
    });
  }

  save(broadcast: Broadcast): Promise<Broadcast> {
    this.repo.save(broadcast);

    return this.repo.findOne(broadcast.id, {
      relations: ['users'],
    });
  }
}
