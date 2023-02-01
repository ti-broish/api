import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../users/entities'
import { ProtocolsModule } from '../protocols/protocols.module'
import { PicturesModule } from '../pictures/pictures.module'
import { ViolationsModule } from '../violations/violations.module'
import { Client } from '../users/entities/client.entity'
import { CaslModule } from '../casl/casl.module'
import { UsersModule } from 'src/users/users.module'
import { StreamsModule } from 'src/streams/streams.module'
import {
  MeClientsController,
  MeController,
  MeProtocolsController,
  MeStreamController,
  MeViolationController,
} from './api'
import { MeCheckinsController } from './api/me-checkins.controller'
import { Checkin } from 'src/checkins/entities/checkin.entity'
import { CheckinsModule } from 'src/checkins/checkins.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Client, Checkin]),
    UsersModule,
    CheckinsModule,
    CaslModule,
    ProtocolsModule,
    PicturesModule,
    ViolationsModule,
    StreamsModule,
  ],
  controllers: [
    MeProtocolsController,
    MeViolationController,
    MeCheckinsController,
    MeClientsController,
    MeStreamController,
    MeController,
  ],
  providers: [],
  exports: [],
})
export class MeModule {}
