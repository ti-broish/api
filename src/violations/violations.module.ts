import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'src/casl/casl.module';
import { PicturesModule } from '../pictures/pictures.module';
import { ViolationCommentsController } from './api/violation-comments.controller';
import { ViolationsController } from './api/violations.controller';
import { ViolationComment } from './entities/violation-comment.entity';
import { ViolationCommentsRepository } from './entities/violation-comments.repository';
import { ViolationUpdate } from './entities/violation-update.entity';
import { Violation } from './entities/violation.entity';
import { ViolationsRepository } from './entities/violations.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Violation, ViolationComment, ViolationUpdate]), CaslModule, PicturesModule],
  controllers: [ViolationsController, ViolationCommentsController],
  providers: [ViolationsRepository, ViolationCommentsRepository],
  exports: [ViolationsRepository, ViolationCommentsRepository],
})
export class ViolationsModule {}
