import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { Section } from './section';

@Controller('sections')
export class SectionsController {

  @Get()
  @HttpCode(200)
  query(@Query('region') region?: string, @Query('town') town?: string): Array<Section> {
    return [];
  }
}
