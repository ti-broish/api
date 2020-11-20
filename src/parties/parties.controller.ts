import { Controller, Get, Post, HttpCode, Param } from '@nestjs/common';
import { Party } from './party';

@Controller('parties')
export class PartiesController {
  @Get()
  @HttpCode(200)
  index(): Array<Party> {
    return [];
  }
}
