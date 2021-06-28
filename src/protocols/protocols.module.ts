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

@Module({
  imports: [
    TypeOrmModule.forFeature([Protocol, Violation]),
    CaslModule,
    PicturesModule,
    UsersModule,
    SectionsModule,
    ViolationsModule,
  ],
  controllers: [
    ProtocolsStatusesController,
    ProtocolsController,
    ProtocolAssigneesController,
  ],
  providers: [ProtocolsRepository],
  exports: [ProtocolsRepository],
})
export class ProtocolsModule {}
