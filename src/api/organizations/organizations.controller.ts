import { Controller, Get, HttpCode, Param } from '@nestjs/common';
import { Organization } from './organization';

@Controller('organizations')
export class OrganizationsController {
  @Get()
  @HttpCode(200)
  index(): Array<Organization> {
    return [];
  }
}
