import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Party } from './party.entity'

@Injectable()
export class PartiesRepository {
  constructor(
    @InjectRepository(Party)
    private repo: Repository<Party>,
  ) {}

  findAll(): Promise<Party[]> {
    return this.repo.find()
  }

  findOne(id: number): Promise<Party> {
    return this.repo.findOneBy({ id })
  }
}
