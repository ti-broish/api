import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElectionRegion } from './electionRegion.entity';

@Injectable()
export class ElectionRegionsRepository {
  constructor(@InjectRepository(ElectionRegion) private repo: Repository<ElectionRegion>) {}

  async findOneOrFail(code: string): Promise<ElectionRegion> {
    return this.repo.findOneOrFail({ where: { code } });
  }

  findAll(): Promise<ElectionRegion[]> {
    return this.repo.find();
  }

  findAllWithMunicipalities(): Promise<ElectionRegion[]> {
    return this.repo.find({ relations: ['municipalities' ]});
  }
}
