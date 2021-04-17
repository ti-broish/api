import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostsRepository } from './entities/posts.repository';
import { IsPostExistsConstraint } from './post-exists.constraint';
import { UsersModule } from '../users/users.module';
import { PostsController } from './posts.controller';
import { CaslModule } from 'src/casl/casl.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), CaslModule, UsersModule],
  providers: [PostsRepository, IsPostExistsConstraint],
  exports: [],
  controllers: [PostsController],
})
export class PostsModule {}
