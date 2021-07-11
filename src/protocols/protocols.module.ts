import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'src/casl/casl.module';
import { UsersModule } from 'src/users/users.module';
import { PicturesModule } from '../pictures/pictures.module';
import { ProtocolAssigneesController } from './api/protocol-assignees.controller';
import { ProtocolsController } from './api/protocols.controller';
import { Protocol } from './entities/protocol.entity';
import { ProtocolsRepository } from './entities/protocols.repository';
import { Violation } from '../violations/entities/violation.entity';
import { ViolationsModule } from '../violations/violations.module';
import { SectionsModule } from 'src/sections/sections.module';
import { ProtocolsStatusesController } from './api/protocols-statuses.controller';
import { ProtocolsOriginsController } from './api/protocols-origins.controller';
import { WorkQueue } from './api/work-queue.service';
import { ConfigModule } from '@nestjs/config';
import { WorkItemsRepository } from './entities/work-items.repository';
import { WorkItem } from './entities/work-item.entity';
import { ProtocolRejectionsController } from './api/protocol-rejections.controller';
import { ProtocolResolutionCommand } from './commands/protocol-resolution.command';
import { CommandModule } from 'nestjs-command';

@Module({
  imports: [
    TypeOrmModule.forFeature([Protocol, Violation, WorkItem]),
    CaslModule,
    PicturesModule,
    UsersModule,
    SectionsModule,
    ViolationsModule,
    ConfigModule,
    CommandModule,
  ],
  controllers: [
    ProtocolRejectionsController,
    ProtocolsStatusesController,
    ProtocolsOriginsController,
    ProtocolsController,
    ProtocolAssigneesController,
  ],
  providers: [
    ProtocolsRepository,
    WorkQueue,
    WorkItemsRepository,
    ProtocolResolutionCommand,
  ],
  exports: [ProtocolsRepository],
})
export class ProtocolsModule {}
