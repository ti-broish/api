import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'src/casl/casl.module';
import { ProtocolConflictExceptionFilter } from 'src/filters';
import { PicturesModule } from '../pictures/pictures.module';
import { ProtocolsController } from './api/protocols.controller';
import { Protocol } from './entities/protocol.entity';
import { ProtocolsRepository } from './entities/protocols.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Protocol]), CaslModule, PicturesModule],
  controllers: [ProtocolsController],
  providers: [
    ProtocolsRepository,
    {
      provide: APP_FILTER,
      useClass: ProtocolConflictExceptionFilter,
    }
  ],
  exports: [ProtocolsRepository],
})
export class ProtocolsModule {}
