import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostsRepository } from './entities/posts.repository';
import { IsPostExistsConstraint } from './api/post-exists.constraint';
import { UsersModule } from '../users/users.module';
import { PostsController } from './api/posts.controller';
import { Broadcast } from './entities/broadcast.entity';
import { Client } from '../users/entities/client.entity';
import { BroadcastsController } from './api/broadcasts.controller';
import { BroadcastsRepository } from './entities/broadcasts.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Broadcast, Client]),
    UsersModule,
  ],
  providers: [PostsRepository, BroadcastsRepository, IsPostExistsConstraint],
  exports: [],
  controllers: [PostsController, BroadcastsController],
})
export class PostsModule {}
