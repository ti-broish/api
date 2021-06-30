import { ApiProperty } from '@nestjs/swagger';
import {
  Exclude,
  Expose,
  plainToClass,
  Transform,
  Type,
} from 'class-transformer';
import {
  IsNotEmpty,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SectionDto } from 'src/sections/api/section.dto';
import { UserDto } from 'src/users/api/user.dto';
import { Checkin } from '../entities/checkin.entity';

@Exclude()
export class CheckinDto {
  @Expose({ groups: ['read'] })
  id: string;

  @ApiProperty({ required: true })
  @Expose({ groups: ['read', 'create'] })
  @Type(() => SectionDto)
  @Transform(
    ({ value: id }) => plainToClass(SectionDto, { id }, { groups: ['create'] }),
    { groups: ['create'] },
  )
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    groups: ['create'],
  })
  section: SectionDto;

  @Expose({ groups: ['read'] })
  timestamp: Date;

  public toEntity(): Checkin {
    return plainToClass<Checkin, Partial<CheckinDto>>(Checkin, this, {
      groups: ['create'],
    });
  }

  public static fromEntity(entity: Checkin): CheckinDto {
    return plainToClass<CheckinDto, Partial<Checkin>>(CheckinDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    });
  }
}
