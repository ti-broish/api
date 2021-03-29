import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities';
import { MeController } from '../users/api/controllers';
import { ProtocolsModule } from '../protocols/protocols.module';
import { PicturesModule } from '../pictures/pictures.module';
import { ViolationsModule } from '../violations/violations.module';
import { ClientsRepository } from '../users/entities/clients.repository';
import { Client } from '../users/entities/client.entity';
import { CaslModule } from '../casl/casl.module';
import { UsersModule } from 'src/users/users.module';
import { StreamsModule } from 'src/streams/streams.module';
import { MeStreamController } from './api/me-stream.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Client]),
    UsersModule,
    CaslModule,
    ProtocolsModule,
    PicturesModule,
    ViolationsModule,
    StreamsModule,
  ],
  controllers: [MeController, MeStreamController],
  providers: [ClientsRepository],
  exports: [ClientsRepository],
})
export class MeModule {}
