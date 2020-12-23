import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Party } from '../entities/party.entity';
import { IsPartyExists } from './party-exists.constraint';

@Exclude()
export class PartyDto {
  @ApiProperty()
  @Expose({ groups: ['read', 'create'] })
  @IsPartyExists({ groups: ['create'] })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @IsInt()
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
