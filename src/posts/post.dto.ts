import { classToPlain, Exclude, Expose, plainToClass, Transform, Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, Length, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { merge } from 'lodash';
import { PictureDto } from 'src/pictures/api/picture.dto';
import { UserDto } from 'src/users/api/user.dto';
import { Post } from './entities/post.entity';
import { IsPostExists } from './post-exists.constraint';

@Exclude()
export class PostDto {
  @Expose({ groups: ['read', 'broadcast.create'] })
  @IsPostExists({ groups: ['broadcast.create'] })
  @IsString({ groups: ['broadcast.create'] })
  @IsNotEmpty({ groups: ['broadcast.create'] })
  @Length(26, 26, { groups: ['broadcast.create'] })
  id: string;

  @Expose({ groups: ['read', 'create', 'update'] })
  @IsNotEmpty({ groups: ['create', 'update'] })
  @MinLength(5, { groups: ['create', 'update'] })
  @MaxLength(200, { groups: ['create', 'update'] })
  title: string;

  @Expose({ groups: ['read'] })
  slug: string;

  @Expose({ groups: ['read', 'create', 'update'] })
  @IsNotEmpty({ groups: ['create', 'update'] })
  @MinLength(20, { groups: ['create', 'update'] })
  @MaxLength(65500, { groups: ['create', 'update'] })
  contents: string;

  @Expose({ groups: ['read'] })
  author: UserDto;

  @Expose({ groups: ['read', 'create', 'update'] })
  @Type(() => PictureDto)
  @IsOptional()
  @Transform(({ value: id }) => id ? plainToClass(PictureDto, { id }, { groups: ['create', 'update'] }) : id, { groups: ['create', 'update'] })
  @ValidateNested({
    groups: ['create', 'update'],
  })
  picture?: PictureDto

  @Expose({ groups: ['create', 'update'] })
  @IsOptional({ always: true })
  @Type(() => Boolean)
  isListed: boolean;

  @Expose({ groups: ['read', 'create', 'update'] })
  @IsDate({ groups: ['create', 'update'] })
  @IsOptional()
  @Type(() => Date)
  publishAt: Date;

  public toEntity(): Post {
    return plainToClass<Post, Partial<PostDto>>(Post, this, {
      groups: ['create'],
    });
  }

  public updateEntity(post: Post): Post {
    const updatedKeys = classToPlain<PostDto>(this, {
      excludeExtraneousValues: false,
      groups: ['update'],
    });

    return merge(post, updatedKeys);
  }

  public static fromEntity(entity: Post): PostDto {
    return plainToClass<PostDto, Partial<Post>>(PostDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    })
  }
}
