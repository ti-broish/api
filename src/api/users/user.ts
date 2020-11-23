import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Organization } from '../organizations/organization';
import { UserCreateDto } from './userCreate.dto';

export class User extends OmitType(UserCreateDto, ['password', 'organization', 'pin'] as const) {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organization: Organization;
}
