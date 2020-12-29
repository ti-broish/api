import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PicturesModule } from '../pictures/pictures.module';
import { ProtocolsController } from './api/protocols.controller';
import { Protocol } from './entities/protocol.entity';
import { ProtocolsRepository } from './entities/protocols.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Protocol]), PicturesModule],
  controllers: [ProtocolsController],
  providers: [ProtocolsRepository],
  exports: [ProtocolsRepository],
})
export class ProtocolsModule {}
