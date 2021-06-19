import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToClass } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Organization } from '../entities/organization.entity';
import { IsOrganizationExists } from './organization-exists.constraint';
import { UserDto } from './user.dto';

@Exclude()
export class OrganizationDto {
  @ApiProperty()
  @Expose({
    groups: [
      'read',
      'create',
      'update',
      'protocol.validate',
      UserDto.AUTHOR_READ,
    ],
  })
  @IsNumber({}, { groups: ['create', 'update'] })
  @IsNotEmpty({ groups: ['create', 'update'] })
  @IsOrganizationExists({ groups: ['create', 'update'] })
  id: number;

  @ApiProperty()
  @Expose({ groups: ['read', 'protocol.validate', UserDto.AUTHOR_READ] })
  name: string;

  @ApiProperty()
  @Expose({ groups: ['read', 'protocol.validate', UserDto.AUTHOR_READ] })
  type: string;

  public static fromEntity(entity: Organization): OrganizationDto {
    return plainToClass<OrganizationDto, Partial<Organization>>(
      OrganizationDto,
      entity,
      {
        excludeExtraneousValues: true,
        groups: ['read'],
      },
    );
  }
}
