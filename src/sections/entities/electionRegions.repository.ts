import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElectionRegion } from './electionRegion.entity';

@Injectable()
export class ElectionRegionsRepository {
  constructor(@InjectRepository(ElectionRegion) private repo: Repository<ElectionRegion>) {}

  findAll(): Promise<ElectionRegion[]> {
    return this.repo.find();
  }

  findAllWithMunicipalities(): Promise<ElectionRegion[]> {
    return this.repo.find({ relations: ['municipalities' ]});
  }
}
