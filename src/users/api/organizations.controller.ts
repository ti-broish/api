import { Controller, Get, HttpCode } from '@nestjs/common'
import { Public } from '../../auth/decorators'
import { OrganizationsRepository } from '../entities/organizations.repository'
import { OrganizationDto } from './organization.dto'

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly repo: OrganizationsRepository) {}

  @Get()
  @Public()
  @HttpCode(200)
  async index(): Promise<OrganizationDto[]> {
    return (await this.repo.findAll()).map(OrganizationDto.fromEntity)
  }
}
