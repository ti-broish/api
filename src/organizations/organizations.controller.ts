import { Controller, Get, Post, HttpCode, Param, Body, Delete } from '@nestjs/common';
import { Organization } from './organization';

@Controller('organizations')
export class OrganizationsController {
  @Get()
  @HttpCode(200)
  index(@Param('id') id: number): Array<Organization> {
    return [];
  }
}
