import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CaslModule } from 'src/casl/casl.module'
import { PicturesModule } from '../pictures/pictures.module'
import { ViolationCommentsController } from './api/violation-comments.controller'
import { ViolationAssigneesController } from './api/violation-assignees.controller'
import ViolationsController from './api/violations.controller'
import { ViolationComment } from './entities/violation-comment.entity'
import { ViolationCommentsRepository } from './entities/violation-comments.repository'
import { ViolationUpdate } from './entities/violation-update.entity'
import { Violation } from './entities/violation.entity'
import { ViolationsRepository } from './entities/violations.repository'
import { UsersModule } from 'src/users/users.module'
import { SectionsModule } from 'src/sections/sections.module'
import { ViolationStatusesController } from './api/violations-statuses.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([Violation, ViolationComment, ViolationUpdate]),
    CaslModule,
    PicturesModule,
    UsersModule,
    SectionsModule,
  ],
  controllers: [
    ViolationStatusesController,
    ViolationsController,
    ViolationCommentsController,
    ViolationAssigneesController,
  ],
  providers: [ViolationsRepository, ViolationCommentsRepository],
  exports: [ViolationsRepository, ViolationCommentsRepository],
})
export class ViolationsModule {}
