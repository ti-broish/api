import { Exclude, Expose, plainToClass, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDate, IsIn, IsNotEmpty, IsUrl, MaxLength, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { UserDto } from 'src/users/api/user.dto';
import { Broadcast, BroadcastStatus, BroadcastTopic, BroadcastType } from '../entities/broadcast.entity';
import { PostDto } from '../../posts/post.dto';

@Exclude()
export class BroadcastDto {
  @Expose({ groups: ['read'] })
  id: string;

  @Expose({ groups: ['read', 'broadcast.create'] })
  @MinLength(5, { always: true })
  @MaxLength(200, { always: true })
  title: string;

  @Expose({ groups: ['read', 'broadcast.create'] })
  @IsNotEmpty({ always: true })
  @MinLength(10, { always: true })
  @MaxLength(500, { always: true })
  contents: string;

  @Expose({ groups: ['read'] })
  author: UserDto;

  @Expose({ groups: ['read', 'broadcast.create'] })
  status: BroadcastStatus;

  @Expose({ groups: ['read', 'broadcast.create'] })
  @ValidateIf((broadcast) => broadcast.users === undefined || broadcast.topics !== undefined, { always: true })
  @IsNotEmpty({ always: true, message: 'at least one of "topics" or "users" should be populated' })
  @IsArray({ always: true })
  @ArrayNotEmpty({ always: true })
  @IsIn(Object.values(BroadcastTopic), {
    always: true,
    each: true,
  })
  topics: BroadcastTopic[];

  @Expose({ groups: ['read', 'broadcast.create'] })
  @ValidateIf((broadcast) => broadcast.users !== undefined || broadcast.topics === undefined, { always: true })
  @IsNotEmpty({ always: true, message: 'at least one of "topics" or "users" should be populated' })
  @IsArray()
  @ArrayNotEmpty({ always: true })
  @Type(() => UserDto)
  @Transform(({ value: ids }) => Array.isArray(ids) ? ids.map(id => plainToClass(UserDto, { id }, { groups: ['broadcast.create'] })) : ids, { groups: ['create'] })
  @ValidateNested({
    always: true,
    each: true,
  })
  users: UserDto[];

  @Expose({ groups: ['read', 'broadcast.create'] })
  @ValidateIf((broadcast) => broadcast.url === undefined, { always: true })
  @IsNotEmpty({
    always: true,
    message: 'either $property or url must be populated',
  })
  @Transform(
    ({obj: broadcast }: {obj: Broadcast}) => broadcast.data && broadcast.data.type === BroadcastType.POST
      ? plainToClass<PostDto, Partial<PostDto>>(PostDto, { id: broadcast.data.postId }, { groups: ['read'] })
      : null,
    { groups: ['read']
  })
  @Type(() => PostDto)
  @ValidateNested({
    always: true,
  })
  post: PostDto;

  @Expose({ groups: ['read', 'broadcast.create'] })
  @ValidateIf((broadcast) => broadcast.post === undefined, { always: true })
  @IsNotEmpty({
    always: true,
    message: 'either $property or post must be populated',
  })
  @IsUrl({
    require_tld: true,
    protocols: ['https'],
    require_protocol: true,
    disallow_auth: true
  }, {
    always: true,
    message: '$property must a valid full HTTPs URL address',
  })
  @Transform(
    ({obj: broadcast }: {obj: Broadcast}) => broadcast.data && broadcast.data.type === BroadcastType.URL
      ? broadcast.data.url
      : null,
    { groups: ['read']
  })
  url: string;

  @Expose({ groups: ['read', 'broadcast.create'] })
  @IsDate({ always: true })
  @Type(() => Date)
  publishAt: Date;

  public toEntity(): Broadcast {
    const broadcast = plainToClass<Broadcast, Partial<BroadcastDto>>(Broadcast, this, {
      groups: ['broadcast.create'],
    });

    if (this.post) {
      broadcast.data = {
        type: BroadcastType.POST,
        postId: this.post.id,
      }
    } else if (this.url) {
      broadcast.data = {
        type: BroadcastType.URL,
        url: this.url,
      };
    }

    return broadcast;
  }

  public static fromEntity(entity: Broadcast): BroadcastDto {
    return plainToClass<BroadcastDto, Partial<Broadcast>>(BroadcastDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    })
  }
}
