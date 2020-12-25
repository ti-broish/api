import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../../users/entities';
import { Report } from './report.entity';
import { ReportUpdateType } from './report-update.entity';

@Injectable()
export class ReportssRepository {
  constructor(@InjectRepository(Report) private readonly repo: Repository<Report>) {}

  findOneOrFail(id: string): Promise<Report> {
    return this.repo.findOneOrFail({ where: { id }, relations: ['section', 'pictures', 'updates', 'updates.actor'] } );
  }

  async save(report: Report): Promise<Report> {
    await this.repo.save(report);

    return this.findOneOrFail(report.id);
  }

  findByAuthor(author: User): Promise<Report[]> {
    return this.repo.find({
      relations: ['section', 'pictures'],
      join: {
        alias: 'report',
        innerJoin: {
          update: 'report.updates'
        }
      },
      where: (qb: SelectQueryBuilder<Report>) => {
        qb
          .where('update.actor_id = :authorId', { authorId: author.id })
          .andWhere('update.type = :type', { type: ReportUpdateType.SEND });
      }
    });
  }
}
