import { Controller, Get, HttpCode } from '@nestjs/common';
import { ElectionRegion } from './electionRegion';

@Controller('election_regions')
export class ElectionRegionsController {

  @Get()
  @HttpCode(200)
  index(): Array<ElectionRegion> {
    return [];
  }
}
