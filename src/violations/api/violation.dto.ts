import { Exclude, Expose, plainToClass, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { SectionDto } from '../../sections/api/section.dto';
import { PictureDto } from '../../pictures/api/picture.dto';
import { Violation, ViolationStatus } from '../entities/violation.entity';

@Exclude()
export class ViolationDto{
  @Expose({ groups: ['read'] })
  id: string;

  @Expose({ groups: ['read', 'create'] })
  @Type(() => SectionDto)
  @Transform((id: string) => plainToClass(SectionDto, { id }, { groups: ['create'] }), { groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  @ValidateNested({
    groups: ['create'],
  })
  section: SectionDto;

  @Expose({ groups: ['read', 'create'] })
  @Type(() => PictureDto)
  @Transform((ids: string[]) => Array.isArray(ids) ? ids.map(id => plainToClass(PictureDto, { id }, { groups: ['create'] })): ids, { groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  @ArrayNotEmpty({ groups: ['create'] })
  @IsArray({ groups: ['create'] })
  @ValidateNested({
    each: true,
    groups: ['create'],
  })
  pictures: PictureDto[];

  @Expose({ groups: ['read', 'create'] })
  @MinLength(20, { groups: ['create'] })
  @MaxLength(2000, { groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  description: string;

  @Expose({ groups: ['read'] })
  status: ViolationStatus;

  public toEntity(): Violation {
    return plainToClass<Violation, Partial<ViolationDto>>(Violation, this, {
      groups: ['create'],
    });
  }

  public static fromEntity(entity: Violation): ViolationDto {
    return plainToClass<ViolationDto, Partial<Violation>>(ViolationDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    });
  }
}
