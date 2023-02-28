import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiQuery, ApiResponse } from '@nestjs/swagger'
import { Public } from 'src/auth/decorators'
import { Action } from 'src/casl/action.enum'
import { AppAbility } from 'src/casl/casl-ability.factory'
import { CheckPolicies } from 'src/casl/check-policies.decorator'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { ApiFirebaseAuth } from '../../auth/decorators/ApiFirebaseAuth.decorator'
import { Section } from '../entities/section.entity'
import { SectionsRepository } from '../entities/sections.repository'
import { SectionDto } from './section.dto'
import { parseSectionsPopulationCsv } from '../population.parser'
import { Readable } from 'stream'
import { Response } from 'express'

@Controller('sections')
@ApiFirebaseAuth()
export class SectionsController {
  constructor(private readonly repo: SectionsRepository) {}

  @Get()
  @HttpCode(200)
  @Public()
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

  @Put('population')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Manage, Section))
  @ApiResponse({
    status: 200,
    description: 'Successful update of sections population',
  })
  @UseInterceptors(FileInterceptor('file'))
  async updatePopulation(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ): Promise<string> {
    // Parse CSV file
    const sections = await parseSectionsPopulationCsv(
      Readable.from(file.buffer),
    )

    // Update population in database
    await this.repo.updatePopulation(sections)
    const response = `Updated population for ${sections.size} sections.`
    res.send(response)

    return response
  }
}
