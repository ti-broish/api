import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PostsRepository } from './entities/posts.repository';
import { PostDto } from './post.dto';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsPostExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(PostsRepository) private readonly repo: PostsRepository,
  ) {}

  async validate(postd?: number): Promise<boolean> {
    if (!postd || typeof postd !== 'string') {
      return false;
    }

    return !!(await this.repo.findOne(postd));
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `Post with ID "${validationArguments.value}" does not exist!`;
  }
}

export function IsPostExists(validationOptions?: ValidationOptions) {
  return function (post: PostDto, propertyName: string) {
    registerDecorator({
      target: post.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPostExistsConstraint,
    });
  };
}
