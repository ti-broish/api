import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
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
import { Response, Express } from 'express'
import 'multer'
import { EntityNotFoundError } from 'typeorm'

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
  async get(
    @Param('section') sectionCode: string,
    @Res() res: Response,
  ): Promise<SectionDto> {
    try {
      const section = await this.repo.findOneOrFail(sectionCode)
      res.send(SectionDto.fromEntity(section, ['read', 'get']))
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        res.status(HttpStatus.NOT_FOUND)
        const partialSection = await this.repo.findOneByPartialIdOrFail(
          sectionCode.slice(0, 6),
        )
        res.send(SectionDto.fromEntity(partialSection, ['partialMatch']))
        return
      }
      throw e
    }
  }

  @Post()
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Section))
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['create.section'] },
      groups: ['create.section'],
    }),
  )
  @ApiResponse({
    status: 201,
    description: 'Successful creation of a section',
  })
  async create(@Body() sectionDto: SectionDto): Promise<SectionDto> {
    console.log('Creating section', sectionDto)
    const existingSection = await this.repo.findOne(sectionDto.id)
    if (existingSection) {
      console.log('Section already exists')
      throw new ConflictException(
        `Section with ID ${sectionDto.id} already exists`,
      )
    }
    const partialSection = await this.repo.findOneByPartialIdOrFail(
      sectionDto.id.slice(0, 6),
    )

    const section = {
      ...partialSection,
      town: sectionDto.town,
      id: sectionDto.id,
      code: sectionDto.id.slice(7),
      place: '',
    } as Section

    await this.repo.save(section)

    return SectionDto.fromEntity(section, ['read', 'get'])
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
    let sections: Map<string, number>
    try {
      // Parse CSV file
      sections = await parseSectionsPopulationCsv(Readable.from(file.buffer))

      // Update population in database
      await this.repo.updatePopulation(sections)
    } catch (e) {
      const typedError = e as Error
      if (
        typedError instanceof RangeError ||
        typedError instanceof ReferenceError
      ) {
        res.status(HttpStatus.BAD_REQUEST).send(typedError.message)
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(typedError.message)
      }
      return typedError?.message
    }

    const response = `Updated population for ${sections.size} sections.`
    res.send(response)

    return response
  }
}
