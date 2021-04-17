import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { OrganizationsRepository } from '../entities/organizations.repository';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsOrganizationExistsConstraint
  implements ValidatorConstraintInterface {
  constructor(
    @Inject(OrganizationsRepository)
    private readonly repo: OrganizationsRepository,
  ) {}

  async validate(organizationId: number): Promise<boolean> {
    if (!organizationId || typeof organizationId !== 'number') {
      return false;
    }

    return !!(await this.repo.findOne(organizationId));
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `Organization with ID "${validationArguments.value}" does not exist!`;
  }
}

export function IsOrganizationExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsOrganizationExistsConstraint,
    });
  };
}
