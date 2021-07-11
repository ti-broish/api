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

  findOneByIdentifier(identifier: string): Promise<Stream> {
    return this.repo.findOne({ where: { identifier } });
  }

  findOneByIdentifierOrFail(identifier: string): Promise<Stream> {
    return this.repo.findOneOrFail({
      where: { identifier },
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

  async findBySection(section: string): Promise<Stream[]> {
    return this.repo.find({
      where: {
        section,
        isCensored: false,
      },
      relations: ['chunks', 'section'],
    });
  }

  findUncensoredStreams(after?: string): Promise<Stream[]> {
    const qb = this.repo.createQueryBuilder('stream');

    qb.leftJoinAndSelect('stream.chunks', 'chunks');
    qb.leftJoinAndSelect('stream.section', 'section');
    qb.leftJoinAndSelect('section.cityRegion', 'cityRegion');
    qb.leftJoinAndSelect('section.electionRegion', 'electionRegion');
    qb.leftJoinAndSelect('section.town', 'town');
    qb.innerJoinAndSelect('town.country', 'country');
    qb.leftJoinAndSelect('town.municipality', 'municipality');
    qb.leftJoinAndSelect('municipality.electionRegions', 'electionRegions');
    qb.where('chunks.isActive = false');

    qb.andWhere('stream.isCensored = false');

    qb.limit(10);
    qb.orderBy('stream.id', 'DESC');

    // Simple cursor pagination
    if (after) {
      qb.andWhere('stream.id < :after', { after });
    }

    return qb.getMany();
  }

  async save(stream: Stream): Promise<Stream> {
    return await this.repo.save(stream);
  }
}
