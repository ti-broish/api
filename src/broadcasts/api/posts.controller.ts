import { Body, Controller, Get, HttpCode, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectUser } from 'src/auth/decorators';
import { User } from 'src/users/entities';
import { PostsRepository } from '../../posts/entities/posts.repository';
import { PostDto } from './post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly repo: PostsRepository) { }

  @Get()
  @HttpCode(200)
  async index(): Promise<PostDto[]> {
    return (await this.repo.findAllPublishedAndListed()).map(PostDto.fromEntity);
  }

  @Post()
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['create'] }, groups: ['create'] }))
  async create(
    @Body() postDto: PostDto,
    @InjectUser() user: User
  ): Promise<PostDto> {
    const post = postDto.toEntity();
    post.author = user;

    return PostDto.fromEntity(await this.repo.save(post));
  }
}
