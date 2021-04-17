import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { TownsRepository } from '../entities/towns.repository';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsTownExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(TownsRepository) private readonly repo: TownsRepository,
  ) {}

  async validate(townId?: number): Promise<boolean> {
    if (!townId) {
      return true;
    }

    if (typeof townId !== 'number' || townId <= 0) {
      return false;
    }

    return !!(await this.repo.findOne(townId));
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `Town with ID "${validationArguments.value}" does not exist!`;
  }
}

export function IsTownExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsTownExistsConstraint,
    });
  };
}
