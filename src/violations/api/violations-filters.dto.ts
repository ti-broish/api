import { Type } from 'class-transformer'
import {
  IsBooleanString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
} from 'class-validator'
import { IsTownExists } from 'src/sections/api/town-exists.constraint'
import { PageDTO } from 'src/utils/page.dto'
import { ViolationStatus, ViolationType } from '../entities/violation.entity'

export class ViolationsFilters extends PageDTO {
  @IsOptional()
  @IsString()
  assignee: string

  @IsOptional()
  @Length(1, 9)
  @IsNumberString()
  section: string

  @IsOptional()
  @IsString()
  @IsEnum(ViolationStatus)
  status: ViolationStatus

  @IsOptional()
  @IsNumberString()
  @Length(2, 2)
  electionRegion: string

  @IsOptional()
  @IsNumberString()
  @Length(2, 2)
  municipality: string

  @IsOptional()
  @IsNumberString()
  @Length(3, 3)
  country: string

  @IsOptional()
  @IsTownExists()
  @Type(() => Number)
  town: number

  @IsOptional()
  @IsNumberString()
  @Length(2, 2)
  cityRegion: string

  @IsOptional()
  @IsBooleanString()
  published: boolean

  @IsOptional()
  @IsString()
  @IsEnum(ViolationType)
  type: ViolationType
}
