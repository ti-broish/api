import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Role } from 'src/casl/role.enum';
import { IsOrganizationExists } from 'src/users/api/organization-exists.constraint';
import { PageDTO } from 'src/utils/page.dto';

export class UsersFilters extends PageDTO {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  firstName: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  lastName: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  email: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @IsOrganizationExists()
  organization: number;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(Role))
  role: string;
}
