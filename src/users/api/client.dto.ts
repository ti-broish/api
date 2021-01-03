import { Exclude, Expose, plainToClass, Type } from 'class-transformer';
import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { Client } from '../entities/client.entity';
import { UserDto } from './user.dto';

@Exclude()
export class ClientDto{
  @Expose({ groups: ['read'] })
  id: string;

  @Expose({ groups: ['create'] })
  @MaxLength(255, { groups: ['create'] })
  @MinLength(100, { groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  token: string;

  @Expose({ groups: ['read'] })
  @Type(() => UserDto)
  owner: UserDto;

  @Expose({ groups: ['read'] })
  isActive: boolean;

  @Expose({ groups: ['read'] })
  registeredAt: Date;

  public toEntity(): Client {
    return plainToClass<Client, Partial<ClientDto>>(Client, this, {
      groups: ['create'],
    });
  }

  public static fromEntity(entity: Client): ClientDto {
    return plainToClass<ClientDto, Partial<Client>>(ClientDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    });
  }
}
