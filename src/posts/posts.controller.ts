import { Ability } from '@casl/ability';
import { Body, Controller, Get, HttpCode, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectUser } from 'src/auth/decorators';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { User } from 'src/users/entities';
import { PostsRepository } from './entities/posts.repository';
import { PostDto } from './post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly repo: PostsRepository) { }

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Post))
  async index(): Promise<PostDto[]> {
    return (await this.repo.findAllPublishedAndListed()).map(PostDto.fromEntity);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Create, Post))
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
