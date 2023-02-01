import { Inject, Injectable } from '@nestjs/common'
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator'
import { StreamsRepository } from '../entities/streams.repository'
import { StreamEventDto } from './stream-event.dto'

@ValidatorConstraint({ async: true })
@Injectable()
export class IsStreamIdentifierExistsConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    @Inject(StreamsRepository) private readonly repo: StreamsRepository,
  ) {}

  async validate(streamIdentifier: string): Promise<boolean> {
    if (!streamIdentifier) {
      return false
    }

    return !!(await this.repo.findOneByIdentifier(streamIdentifier))
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `Stream with identifier "${validationArguments.value}" does not exist!`
  }
}

export function IsStreamIdentifierExists(
  validationOptions?: ValidationOptions,
) {
  return function (object: StreamEventDto, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStreamIdentifierExistsConstraint,
    })
  }
}
