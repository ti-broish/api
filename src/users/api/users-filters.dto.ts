import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { IsOrganizationExists } from 'src/users/api/organization-exists.constraint';
import { PageDTO } from 'src/utils/page.dto';

export class UsersFilters extends PageDTO {
  @IsOptional()
  firstName: string;

  @IsOptional()
  lastName: string;

  @IsOptional()
  email: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @IsOrganizationExists()
  organization: number;

  @IsOptional()
  role: string;
}
