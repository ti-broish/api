import { Module } from '@nestjs/common';
import { ProtocolsModule } from '../protocols/protocols.module';
import { PartiesModule } from '../parties/parties.module';
import { SectionsModule } from '../sections/sections.module';
import { ResultsController } from './api/results.controller';

@Module({
  imports: [ProtocolsModule, SectionsModule, PartiesModule],
  controllers: [ResultsController],
  providers: [],
  exports: [],
})
export class ResultsModule {}
