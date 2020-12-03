import { Module } from '@nestjs/common';
import { ProtocolsController } from './api/protocols.controller';

@Module({
  controllers: [ProtocolsController],
})
export class ProtocolsModule {}
