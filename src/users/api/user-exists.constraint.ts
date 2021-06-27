import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UsersRepository } from '../entities/users.repository';
import { UserDto } from './user.dto';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUserExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(UsersRepository) private readonly repo: UsersRepository,
  ) {}

  async validate(userId?: string): Promise<boolean> {
    if (!userId || typeof userId !== 'string') {
      return false;
    }

    return !!(await this.repo.findOne(userId));
  }

  defaultMessage?(): string {
    return `User with ID "$value" does not exist!`;
  }
}

export function IsUserExists(validationOptions?: ValidationOptions) {
  return function (target: UserDto | object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUserExistsConstraint,
    });
  };
}
