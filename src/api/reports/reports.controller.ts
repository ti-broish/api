import { Controller, Get, Post, HttpCode, Query, Param, Body } from '@nestjs/common';
import { Report } from './report';
import { ReportCreateDto } from './reportCreate.dto';

@Controller('reports')
export class ReportsController {
  @Post()
  @HttpCode(201)
  create(@Body() reportCreateDto: ReportCreateDto): Report {
    return new Report();
  }

  @Get()
  @HttpCode(200)
  query(@Query('author') author: number): Array<Report> {
    return [];
  }

  @Get(':id')
  @HttpCode(200)
  get(@Param('id') id: number): Report {
    return new Report();
  }
}
