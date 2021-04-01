import { Exclude, Expose, plainToClass } from "class-transformer";
import { Party } from "src/parties/entities/party.entity";

@Exclude()
export class PartyDto {
  @Expose({ name: 'id' })
  number: number;

  @Expose()
  name: string;

  @Expose()
  color: string;

  public static fromEntity(entity: Party): PartyDto {
    return plainToClass<PartyDto, Partial<Party>>(PartyDto, entity, {
      excludeExtraneousValues: true,
    });
  }
}
