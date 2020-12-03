import { Controller, Get, HttpCode } from '@nestjs/common';
import { Party } from './party.dto';

@Controller('parties')
export class PartiesController {
  @Get()
  @HttpCode(200)
  index(): Array<Party> {
    return [];
  }
}
