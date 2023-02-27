import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CaslModule } from '../casl/casl.module'
import { UsersModule } from 'src/users/users.module'
import { SectionsModule } from 'src/sections/sections.module'
import { StreamsRepository } from './entities/streams.repository'
import { StreamsController } from './api/streams.controller'
import { Stream } from './entities/stream.entity'
import { StreamCensor } from './api/stream-censor.service'
import { ConfigModule } from '@nestjs/config'
import { StreamsWebhookController } from './api/streams-webhook.controller'
import StreamManager from './api/stream-manager.service'
import { forwardRef } from '@nestjs/common'
import { SectionStreamsController } from './api/section-streams.controller'
import { IsStreamIdentifierExistsConstraint } from './api/stream-exists.constraint'
import { StreamChunk } from './entities/stream-chunk.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Stream, StreamChunk]),
    UsersModule,
    CaslModule,
    forwardRef(() => SectionsModule),
    HttpModule,
    ConfigModule,
  ],
  providers: [
    StreamsRepository,
    StreamCensor,
    StreamManager,
    IsStreamIdentifierExistsConstraint,
  ],
  exports: [StreamsRepository],
  controllers: [
    StreamsController,
    StreamsWebhookController,
    SectionStreamsController,
  ],
})
export class StreamsModule {}
