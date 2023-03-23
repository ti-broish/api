import { Type } from 'class-transformer'
import {
  IsOptional,
  IsNumberString,
  Length,
  IsString,
  IsEnum,
  IsInt,
} from 'class-validator'
import { IsTownExists } from 'src/sections/api/town-exists.constraint'
import { IsOrganizationExists } from 'src/users/api/organization-exists.constraint'
import { IsUserExists } from 'src/users/api/user-exists.constraint'
import { PageDTO } from 'src/utils/page.dto'
import { IsULID } from 'src/utils/ulid-constraint'
import { ProtocolOrigin, ProtocolStatus } from '../entities/protocol.entity'

export class ProtocolFilters extends PageDTO {
  @IsOptional()
  @IsOptional()
  @IsULID()
  @IsUserExists()
  assignee: string

  @IsOptional()
  @Length(1, 9)
  @IsNumberString()
  section: string

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
  @IsString()
  @IsEnum(ProtocolStatus)
  status: ProtocolStatus

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @IsOrganizationExists()
  organization: number

  @IsOptional()
  @IsString()
  @IsEnum(ProtocolOrigin)
  origin: ProtocolOrigin
}
