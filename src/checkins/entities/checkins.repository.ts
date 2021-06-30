import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Checkin } from './checkin.entity';

@Injectable()
export class CheckinsRepository {
  constructor(@InjectRepository(Checkin) private repo: Repository<Checkin>) {}

  async save(checkin: Checkin): Promise<Checkin> {
    return await this.repo.save(checkin);
  }
}
