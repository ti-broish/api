import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { CountriesRepository } from '../entities/countries.repository';
import { CountryDto } from './country.dto';

@Controller('countries')
export class CountriesController {

  constructor(private readonly repo: CountriesRepository) {}

  @Get()
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Successful index of all countries'})
  async index(): Promise<CountryDto[]> {
    return (await this.repo.findAll()).map(CountryDto.fromEntity);
  }
}
