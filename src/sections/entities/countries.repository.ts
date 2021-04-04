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

  findOneOrFail(code: string): Promise<Country> {
    return this.repo.createQueryBuilder('country')
      .innerJoinAndSelect('country.towns', 'towns')
      .innerJoinAndSelect('towns.sections', 'sections')
      .andWhere('country.code = :code', { code })
      .getOneOrFail();
  }

  async findAllAbroadWithStats(): Promise<Country[]> {
    const qb = this.repo.createQueryBuilder('countries')
      .andWhere('countries.isAbroad = :isAbroad', { isAbroad: true })
      .orderBy('countries.code', 'ASC');

    return qb.getMany();
  }
}
