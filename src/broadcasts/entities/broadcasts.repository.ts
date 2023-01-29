import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import dateformat from 'dateformat';
import { Broadcast, BroadcastStatus } from './broadcast.entity';

@Injectable()
export class BroadcastsRepository {
  constructor(
    @InjectRepository(Broadcast)
    private repo: Repository<Broadcast>,
  ) {}

  findOne(id: string): Promise<Broadcast | undefined> {
    return this.repo.findOneBy({ id });
  }

  findOneOrFail(id: string): Promise<Broadcast> {
    return this.repo.findOneByOrFail({ id });
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

    return this.repo.findOne({
      where: {
        id: broadcast.id,
      },
      relations: ['users'],
    });
  }
}
