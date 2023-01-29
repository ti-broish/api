import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import dateformat from 'dateformat';
import slugify from '@sindresorhus/slugify';
import { Post } from './post.entity';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post)
    private repo: Repository<Post>,
  ) {}

  findOne(id: string): Promise<Post | undefined> {
    return this.repo.findOneBy({ id });
  }

  findOneOrFail(id: string): Promise<Post> {
    return this.repo.findOneByOrFail({ id });
  }

  findAll(): Promise<Post[]> {
    return this.repo.find();
  }

  findAllPublishedAndListed(publishedBeforeDate?: Date): Promise<Post[]> {
    if (publishedBeforeDate === undefined) {
      publishedBeforeDate = new Date();
    }
    const date = dateformat(publishedBeforeDate, "yyyy-mm-dd' 'HH:MM:ss");

    return this.repo.find({
      where: {
        publishAt: Raw((alias) => `${alias} <= :date`, { date }),
        isListed: true,
      },
      order: {
        publishAt: 'DESC',
      },
    });
  }

  save(post: Post): Promise<Post> {
    post.slug = slugify(post.title);
    return this.repo.save(post);
  }
}
