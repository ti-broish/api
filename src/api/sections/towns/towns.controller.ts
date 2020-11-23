import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { Town } from './town';

@Controller('towns')
export class TownsController {

  @Get()
  @HttpCode(200)
  index(@Query('country') country: string, @Query('municipality') municipality: string): Array<Town> {
    return [];
  }
}
