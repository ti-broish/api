import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass } from 'class-transformer';
import { Organization } from '../entities/organization.entity';

@Exclude()
export class OrganizationDto {
  @ApiProperty()
  @Expose({ groups: ['read', 'create'] })
  id: number;

  @ApiProperty()
  @Expose({ groups: ['read'] })
  name: string;

  public static fromEntity(entity: Organization): OrganizationDto {
    return plainToClass<OrganizationDto, Partial<Organization>>(OrganizationDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    })
  }
}
