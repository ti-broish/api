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

  async findAllAbroadWithStats(): Promise<Country[]> {
    const qb = this.repo.createQueryBuilder('countries');

    // qb.loadRelationCountAndMap('sectionsCount', 'countries.sections');
    qb.andWhere('countries.isAbroad = :isAbroad', { isAbroad: true });
    qb.groupBy('countries.id');

    return qb.getMany();
  }
}
