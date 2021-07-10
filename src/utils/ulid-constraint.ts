import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsULIDConstraint implements ValidatorConstraintInterface {
  async validate(id?: string): Promise<boolean> {
    return typeof id === 'string' && /[A-Z0-9]{26}/.test(id);
  }

  defaultMessage?(context: ValidationArguments): string {
    return `${context.property} identifier is not an ULID`;
  }
}

export function IsULID(validationOptions?: ValidationOptions) {
  return function (entity: object, propertyName: string) {
    registerDecorator({
      target: entity.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsULIDConstraint,
    });
  };
}
