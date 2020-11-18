import { Controller, Get, Post, HttpCode, Query, Param, Body } from '@nestjs/common';
import { Protocol } from './protocol';
import { ProtocolCreateDto } from './protocolCreate.dto';

@Controller('protocols')
export class ProtocolsController {
  @Post()
  @HttpCode(201)
  create(@Body() protocolCreateDto: ProtocolCreateDto): Protocol {
    return new Protocol();
  }

  @Get()
  @HttpCode(200)
  query(@Query('author') author: number): Array<Protocol> {
    return [];
  }

  @Get(':id')
  @HttpCode(200)
  get(@Param('id') id: number): Protocol {
    return new Protocol();
  }
}
