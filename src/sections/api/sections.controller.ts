import { Ability } from '@casl/ability';
import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { StreamsRepository } from 'src/streams/entities/streams.repository';
import { ApiFirebaseAuth } from '../../auth/decorators/ApiFirebaseAuth.decorator';
import { Section } from '../entities/section.entity';
import { SectionsRepository } from '../entities/sections.repository';
import { SectionDto } from './section.dto';
import { StreamDto } from 'src/streams/api/stream.dto';
import { Stream } from 'stream';
import { Public } from 'src/auth/decorators';

@Controller('sections')
@ApiFirebaseAuth()
export class SectionsController {
  constructor(
    private readonly repo: SectionsRepository,
    private readonly streamsRepo: StreamsRepository,
  ) {}

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Section))
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
    ).map((section: Section) => SectionDto.fromEntity(section));
  }

  @Get(':section')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Section))
  @ApiResponse({
    status: 200,
    description: 'Successful retrieval of a section',
  })
  async get(@Param('section') sectionCode?: string): Promise<SectionDto> {
    return SectionDto.fromEntity(
      await this.repo.findOneOrFailWithRelations(sectionCode),
      ['read', 'get'],
    );
  }

  @Get(':section/streams')
  @Public()
  @HttpCode(200)
  async getStreams(
    @Param('section') sectionCode?: string,
  ): Promise<StreamDto[]> {
    const streamsInSection = await this.streamsRepo.findBySection(sectionCode);

    return streamsInSection.map((stream) =>
      StreamDto.fromEntity(stream, [StreamDto.WATCH]),
    );
  }
}
