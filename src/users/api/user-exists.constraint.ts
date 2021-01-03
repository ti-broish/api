import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { UsersRepository } from '../entities/users.repository';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUserExistsConstraint implements ValidatorConstraintInterface {
  constructor(@Inject(UsersRepository) private readonly repo: UsersRepository) { }

  async validate(userId?: string): Promise<boolean> {
    if (!userId || typeof(userId) !== 'string') {
      return false;
    }

    return !!(await this.repo.findOne(userId));
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `User with ID "${validationArguments.value}" does not exist!`;
  }
}

export function IsUserExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUserExistsConstraint,
    });
  };
}
