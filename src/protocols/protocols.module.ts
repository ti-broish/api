import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'src/casl/casl.module';
import { UsersRepository } from 'src/users/entities/users.repository';
import { UsersModule } from 'src/users/users.module';
import { PicturesModule } from '../pictures/pictures.module';
import { ProtocolAssigneesController } from './api/protocol-assignees.controller';
import { ProtocolsController } from './api/protocols.controller';
import { Protocol } from './entities/protocol.entity';
import { ProtocolsRepository } from './entities/protocols.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Protocol]), CaslModule, PicturesModule, UsersModule],
  controllers: [ProtocolsController, ProtocolAssigneesController],
  providers: [ProtocolsRepository],
  exports: [ProtocolsRepository],
})
export class ProtocolsModule {}
