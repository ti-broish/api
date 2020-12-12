import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass } from 'class-transformer';
import { Party } from '../entities/party.entity';

@Exclude()
export class PartyDto {
  @ApiProperty()
  @Expose({ groups: ['read'] })
  id: number;

  @ApiProperty()
  @Expose({ groups: ['read'] })
  name: string;

  @ApiProperty()
  @Expose({ groups: ['read'] })
  displayName: string

  public static fromEntity(entity: Party): PartyDto {
    return plainToClass<PartyDto, Partial<Party>>(PartyDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    })
  }
}
