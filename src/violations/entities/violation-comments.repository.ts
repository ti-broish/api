import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Violation } from './violation.entity';
import { ViolationComment } from './violation-comment.entity';

@Injectable()
export class ViolationCommentsRepository {
  constructor(@InjectRepository(ViolationComment) private readonly repo: Repository<ViolationComment>) {}

  findOneOrFail(id: string): Promise<ViolationComment> {
    return this.repo.findOneOrFail({ where: { id }, relations: ['violation', 'author'] } );
  }

  queryBuilderForViolation(violation: Violation): SelectQueryBuilder<ViolationComment> {
    const qb = this.repo.createQueryBuilder('violation_comment');

    qb.innerJoinAndSelect('violation_comment.violation', 'violation');
    qb.innerJoinAndSelect('violation_comment.author', 'author');
    qb.andWhere('violation.id = :violationId', { violationId: violation.id });

    return qb;
  }

  async save(violationComment: ViolationComment): Promise<ViolationComment> {
    await this.repo.save(violationComment);

    return this.findOneOrFail(violationComment.id);
  }
}
