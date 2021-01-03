import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostsRepository } from './entities/posts.repository';
import { IsPostExistsConstraint } from '../broadcasts/api/api/post-exists.constraint';
import { UsersModule } from '../users/users.module';
import { PostsController } from '../broadcasts/api/api/posts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    UsersModule,
  ],
  providers: [PostsRepository, IsPostExistsConstraint],
  exports: [],
  controllers: [PostsController],
})
export class PostsModule {}
