import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { Municipality } from './municipality';

@Controller('municipalities')
export class MunicipalitiesController {

  @Get()
  @HttpCode(200)
  query(@Query('election_region') electionRegion: string): Array<Municipality> {
    return [];
  }
}
