import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'src/casl/casl.module';
import { UsersModule } from 'src/users/users.module';
import { PicturesModule } from '../pictures/pictures.module';
import { ProtocolAssigneesController } from './api/protocol-assignees.controller';
import { ProtocolsController } from './api/protocols.controller';
import { Protocol } from './entities/protocol.entity';
import { ProtocolsRepository } from './entities/protocols.repository';
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forFeature([Protocol]),
    CaslModule,
    PicturesModule,
    UsersModule,
    ConfigModule,
  ],
  controllers: [ProtocolsController, ProtocolAssigneesController],
  providers: [ProtocolsRepository],
  exports: [ProtocolsRepository],
})
export class ProtocolsModule {}
