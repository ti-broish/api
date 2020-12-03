import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';

@Injectable()
export class OrganizationsRepository {
  constructor(
    @InjectRepository(Organization)
    private repo: Repository<Organization>,
  ) {}

  findAll(): Promise<Organization[]> {
    return this.repo.find();
  }
}
