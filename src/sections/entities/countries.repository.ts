import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './country.entity';

@Injectable()
export class CountriesRepository {
  constructor(@InjectRepository(Country) private repo: Repository<Country>) {}

  findAll(): Promise<Country[]> {
    return this.repo.find();
  }
}
