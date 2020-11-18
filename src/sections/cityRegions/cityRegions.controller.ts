import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { CityRegion } from './cityRegion';

@Controller('city_regions')
export class CityRegionsController {

  @Get()
  @HttpCode(200)
  query(@Query('town') town: string): Array<CityRegion> {
    return [];
  }
}
