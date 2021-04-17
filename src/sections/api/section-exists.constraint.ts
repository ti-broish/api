import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Section } from '../entities';
import { SectionsRepository } from '../entities/sections.repository';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsSectionExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(SectionsRepository) private readonly repo: SectionsRepository,
  ) {}

  async validate(sectionId?: string): Promise<boolean> {
    if (!sectionId) {
      return true;
    }

    if (
      typeof sectionId !== 'string' ||
      sectionId.length !== Section.SECTION_ID_LENGTH
    ) {
      return false;
    }

    return !!(await this.repo.findOne(sectionId));
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `Section with ID "${validationArguments.value}" does not exist!`;
  }
}

export function IsSectionExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSectionExistsConstraint,
    });
  };
}
