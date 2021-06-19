import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PartiesRepository } from '../entities/parties.repository';
import { PartyDto } from './party.dto';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsPartyExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(PartiesRepository) private readonly repo: PartiesRepository,
  ) {}

  async validate(partyId?: number): Promise<boolean> {
    if (partyId === null || typeof partyId !== 'number' || partyId < 0) {
      return false;
    }

    return !!(await this.repo.findOne(partyId));
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `Party with ID "${validationArguments.value}" does not exist!`;
  }
}

export function IsPartyExists(validationOptions?: ValidationOptions) {
  return function (party: PartyDto, propertyName: string) {
    registerDecorator({
      target: party.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPartyExistsConstraint,
    });
  };
}
