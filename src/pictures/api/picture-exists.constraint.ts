import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PicturesRepository } from '../entities/pictures.repository';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsPictureExistsConstraint implements ValidatorConstraintInterface {
  constructor(@Inject(PicturesRepository) private readonly repo: PicturesRepository) { }

  async validate(pictureId?: string): Promise<boolean> {
    if (!pictureId) {
      return true;
    }

    if (typeof(pictureId) !== 'string') {
      return false;
    }

    return !!(await this.repo.findOne(pictureId));
  }

  defaultMessage?(): string {
    return 'Picture with $property "$value" does not exist!';
  }
}

export function IsPictureExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPictureExistsConstraint,
    });
  };
}
