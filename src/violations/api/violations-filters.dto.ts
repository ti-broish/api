import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { IsTownExists } from 'src/sections/api/town-exists.constraint';
import { IsOrganizationExists } from 'src/users/api/organization-exists.constraint';
import { IsUserExists } from 'src/users/api/user-exists.constraint';
import { PageDTO } from 'src/utils/page.dto';
import { IsULID } from 'src/utils/ulid-constraint';
import { ViolationStatus } from '../entities/violation.entity';

export class ViolationsFilters extends PageDTO {
  @IsOptional()
  @IsULID()
  @IsUserExists()
  assignee: string;

  @IsOptional()
  @Length(1, 9)
  @IsNumberString()
  section: string;

  @IsOptional()
  @IsString()
  @IsEnum(ViolationStatus)
  status: ViolationStatus;

  @IsOptional()
  @IsNumberString()
  @Length(2, 2)
  electionRegion: string;

  @IsOptional()
  @IsNumberString()
  @Length(2, 2)
  municipality: string;

  @IsOptional()
  @IsNumberString()
  @Length(2, 2)
  country: string;

  @IsOptional()
  @IsTownExists()
  @Type(() => Number)
  town: number;

  @IsOptional()
  @IsNumberString()
  @Length(2, 2)
  cityRegion: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @IsOrganizationExists()
  organization: number;

  @IsOptional()
  @IsBooleanString()
  published: boolean;
}
