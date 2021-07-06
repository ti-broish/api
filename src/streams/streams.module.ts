import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from '../casl/casl.module';
import { UsersModule } from 'src/users/users.module';
import { SectionsModule } from 'src/sections/sections.module';
import { StreamsRepository } from './entities/streams.repository';
import { StreamsController } from './api/streams.controller';
import { Stream } from './entities/stream.entity';
import { StreamCensor } from './api/stream-censor.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stream]),
    UsersModule,
    CaslModule,
    SectionsModule,
    HttpModule,
    ConfigModule,
  ],
  providers: [StreamsRepository, StreamCensor],
  exports: [StreamsRepository],
  controllers: [StreamsController],
})
export class StreamsModule {}
