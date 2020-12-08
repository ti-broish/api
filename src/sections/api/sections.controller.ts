import { Controller, Get, HttpCode, ParseIntPipe, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ApiFirebaseAuth } from '../../auth/decorators/ApiFirebaseAuth.decorator';
import { Section } from '../entities/section.entity';
import { SectionsRepository } from '../entities/sections.repository';
import { SectionDto } from './section.dto';

@Controller('sections')
@ApiFirebaseAuth()
export class SectionsController {

  constructor(private readonly repo: SectionsRepository) {}

  @Get()
  @HttpCode(200)
  @ApiQuery({
    name: "town",
    description: "The town code to filter by",
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: "city_region",
    description: "The city region code to filter by",
    required: false,
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Successful query of sections'})
  @ApiResponse({ status: 400, description: 'Invalid query parameters'})
  async query(
    @Query('town', ParseIntPipe) townId: number,
    @Query('city_region') cityRegionCode?: string,
  ): Promise<SectionDto[]> {
    const sections: Section[] = cityRegionCode
      ? await this.repo.findByCityRegion(townId, cityRegionCode)
      : await this.repo.findByTown(townId);

    return sections.map(SectionDto.fromEntity);
  }
}
