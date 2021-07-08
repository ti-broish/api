import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Stream } from './stream.entity';

@Injectable()
export class StreamsRepository {
  constructor(
    @InjectRepository(Stream) private readonly repo: Repository<Stream>,
  ) {}

  findOneOrFail(id: string): Promise<Stream> {
    return this.repo.findOneOrFail({
      where: {
        id,
        isCensored: false,
      },
      relations: ['chunks', 'section', 'user'],
    });
  }

  findOneWithSectionOrFail(id: string): Promise<Stream> {
    return this.repo.findOneOrFail({
      where: {
        id,
        isCensored: false,
      },
      relations: [
        'chunks',
        'section',
        'section.electionRegion',
        'section.town',
        'section.cityRegion',
        'section.town.municipality',
        'section.town.country',
      ],
    });
  }

  findAvailableStreamOrFail(): Promise<Stream> {
    return this.repo.findOneOrFail({
      where: {
        isCensored: false,
        isAssigned: false,
      },
    });
  }

  findForUser(user: User): Promise<Stream | null> {
    return this.repo.findOne({
      relations: [
        'section',
        'section.electionRegion',
        'section.town',
        'section.town.municipality',
        'section.cityRegion',
      ],
      join: {
        alias: 'stream',
        innerJoin: {
          user: 'stream.user',
        },
      },
      where: (qb: SelectQueryBuilder<Stream>) => {
        qb.where('user.id = :userId', { userId: user.id });
      },
    });
  }

  async findBySection(sectionId: string): Promise<Stream[]> {
    return this.repo.find({
      where: { section: sectionId },
      relations: ['chunks', 'section'],
    });
  }

  async save(stream: Stream): Promise<void> {
    await this.repo.save(stream);
  }
}
