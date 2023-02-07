import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiQuery, ApiResponse } from '@nestjs/swagger'
import { Action } from 'src/casl/action.enum'
import { AppAbility } from 'src/casl/casl-ability.factory'
import { CheckPolicies } from 'src/casl/check-policies.decorator'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { ApiFirebaseAuth } from '../../auth/decorators/ApiFirebaseAuth.decorator'
import { Section } from '../entities/section.entity'
import { SectionsRepository } from '../entities/sections.repository'
import { SectionDto } from './section.dto'

@Controller('sections')
@ApiFirebaseAuth()
export class SectionsController {
  constructor(private readonly repo: SectionsRepository) {}

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Section))
  @ApiQuery({
    name: 'town',
    description: 'The town code to filter by',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'city_region',
    description: 'The city region code to filter by',
    required: false,
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Successful query of sections' })
  async query(
    @Query('town', ParseIntPipe) townId: number,
    @Query('city_region') cityRegionCode?: string,
  ): Promise<SectionDto[]> {
    return (
      await this.repo.findByTownAndCityRegion(townId, cityRegionCode)
    ).map((section: Section) => SectionDto.fromEntity(section))
  }

  @Get(':section')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Section))
  @ApiResponse({
    status: 200,
    description: 'Successful retrieval of a section',
  })
  async get(@Param('section') sectionCode?: string): Promise<SectionDto> {
    return SectionDto.fromEntity(
      await this.repo.findOneOrFailWithRelations(sectionCode),
      ['read', 'get'],
    )
  }
}
