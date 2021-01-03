import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Broadcast } from '../broadcasts/entities/broadcast.entity';
import { BroadcastsController } from '../broadcasts/api/api/broadcasts.controller';
import { BroadcastsRepository } from '../broadcasts/entities/broadcasts.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Broadcast]),
    UsersModule,
  ],
  providers: [BroadcastsRepository],
  exports: [],
  controllers: [BroadcastsController],
})
export class BroadcastsModule {}
