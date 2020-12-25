import { Exclude, Expose, plainToClass, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { SectionDto } from '../../sections/api/section.dto';
import { PictureDto } from '../../pictures/api/picture.dto';
import { Report, ReportStatus } from '../entities/report.entity';

@Exclude()
export class ReportDto{
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
  status: ReportStatus;

  public toEntity(): Report {
    return plainToClass<Report, Partial<ReportDto>>(Report, this, {
      groups: ['create'],
    });
  }

  public static fromEntity(entity: Report): ReportDto {
    return plainToClass<ReportDto, Partial<Report>>(ReportDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    });
  }
}
