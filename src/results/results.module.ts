import { Module } from '@nestjs/common'
import { ProtocolsModule } from '../protocols/protocols.module'
import { PartiesModule } from '../parties/parties.module'
import { SectionsModule } from '../sections/sections.module'
import { ResultsController } from './api/results.controller'
import { CrumbMaker } from './api/crumb-maker.service'
import { ConfigModule } from '@nestjs/config'
import { PicturesModule } from 'src/pictures/pictures.module'

@Module({
  imports: [
    ProtocolsModule,
    SectionsModule,
    PartiesModule,
    ConfigModule,
    PicturesModule,
  ],
  controllers: [ResultsController],
  providers: [CrumbMaker],
  exports: [],
})
export class ResultsModule {}
