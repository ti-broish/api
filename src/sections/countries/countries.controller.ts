import { Controller, Get, HttpCode } from '@nestjs/common';
import { Country } from './country';

@Controller('countries')
export class CountriesController {

  @Get()
  @HttpCode(200)
  index(): Array<Country> {
    return [];
  }
}
