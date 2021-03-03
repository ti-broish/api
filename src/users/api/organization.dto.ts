import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsNumberString } from 'class-validator';
import { Organization } from '../entities/organization.entity';
import { IsOrganizationExists } from './organization-exists.constraint';

@Exclude()
export class OrganizationDto {
  @ApiProperty()
  @Expose({ groups: ['read', 'create', 'update', 'protocol.validate'] })
  @IsNumber({}, { groups: ['create', 'update'] })
  @IsNotEmpty({ groups: ['create', 'update'] })
  @IsOrganizationExists({ groups: ['create', 'update'] })
  id: number;

  @ApiProperty()
  @Expose({ groups: ['read', 'protocol.validate'] })
  name: string;

  public static fromEntity(entity: Organization): OrganizationDto {
    return plainToClass<OrganizationDto, Partial<Organization>>(OrganizationDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    })
  }
}
