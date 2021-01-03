import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PostsRepository } from '../../posts/entities/posts.repository';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsPostExistsConstraint implements ValidatorConstraintInterface {
  constructor(@Inject(PostsRepository) private readonly repo: PostsRepository) { }

  async validate(postd?: number): Promise<boolean> {
    if (!postd || typeof(postd) !== 'string') {
      return false;
    }

    return !!(await this.repo.findOne(postd));
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `Post with ID "${validationArguments.value}" does not exist!`;
  }
}

export function IsPostExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPostExistsConstraint,
    });
  };
}
