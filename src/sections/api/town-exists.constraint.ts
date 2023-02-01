import { Inject, Injectable } from '@nestjs/common'
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator'
import { TownsRepository } from '../entities/towns.repository'
import { TownDto } from './town.dto'

@ValidatorConstraint({ async: true })
@Injectable()
export class IsTownExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(TownsRepository) private readonly repo: TownsRepository,
  ) {}

  async validate(townCode?: number): Promise<boolean> {
    if (!townCode) {
      return true
    }

    if (typeof townCode !== 'number' || townCode <= 0) {
      return false
    }

    return !!(await this.repo.findOneByCode(townCode))
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `Town with code "${validationArguments.value}" does not exist!`
  }
}

export function IsTownExists(validationOptions?: ValidationOptions) {
  return function (town: TownDto | object, propertyName: string) {
    registerDecorator({
      target: town.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsTownExistsConstraint,
    })
  }
}
