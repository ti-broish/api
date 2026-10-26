import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Patch,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { Express } from 'express'
import 'multer'
import { Public } from 'src/auth/decorators'
import { Action } from 'src/casl/action.enum'
import { AppAbility } from 'src/casl/casl-ability.factory'
import { CheckPolicies } from 'src/casl/check-policies.decorator'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { ApiFirebaseAuth } from '../../auth/decorators/ApiFirebaseAuth.decorator'
import {
  AbroadAddressesInputError,
  AbroadAddressesReport,
  AbroadAddressesService,
  AbroadAddressInput,
  AbroadSectionListItem,
  parseAbroadAddressesCsv,
  parseAbroadAddressesJson,
} from '../abroad-addresses'
import { Section } from '../entities/section.entity'

const parseDryRun = (value: string | undefined): boolean => {
  if (value === undefined || value === '') {
    return false
  }
  const v = value.trim().toLowerCase()
  if (['1', 'true', 'yes'].includes(v)) {
    return true
  }
  if (['0', 'false', 'no'].includes(v)) {
    return false
  }
  throw new BadRequestException('dryRun must be true or false')
}

/**
 * Abroad sections (election region 32): a public list with their addresses,
 * and an admin-only update of the addresses. Registered before
 * SectionsController so /sections/abroad is not read as /sections/:section.
 */
@Controller('sections/abroad')
@ApiFirebaseAuth()
export class AbroadAddressesController {
  constructor(private readonly service: AbroadAddressesService) {}

  @Get()
  @HttpCode(200)
  @Public()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Section))
  @Header('Cache-Control', 'public, max-age=300')
  @ApiResponse({
    status: 200,
    description:
      'Every abroad section: id, code, place (committee name), address (null until loaded), town and country',
  })
  list(): Promise<AbroadSectionListItem[]> {
    return this.service.list()
  }

  @Patch('addresses')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Manage, Section))
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description:
      'A multipart CSV upload in field "file" with a section_id (or id, № на секция) and an address (Адрес) column, or JSON {"sections": [{"id": "320902332", "address": "…"}]}. Only the address of existing abroad sections is written; unknown ids are reported, never created.',
  })
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: Boolean,
    description: 'Apply in a transaction, report, then roll back',
  })
  @ApiResponse({ status: 200, description: 'Report of what changed' })
  @ApiResponse({ status: 400, description: 'Invalid input; nothing changed' })
  async updateAddresses(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: unknown,
    @Query('dryRun') dryRunParam?: string,
  ): Promise<AbroadAddressesReport> {
    const dryRun = parseDryRun(dryRunParam)
    let input: AbroadAddressInput[]
    try {
      input = file
        ? parseAbroadAddressesCsv(file.buffer)
        : parseAbroadAddressesJson(body)
    } catch (e) {
      if (e instanceof AbroadAddressesInputError) {
        throw new BadRequestException({
          message: e.message,
          errors: e.problems,
        })
      }
      throw e
    }
    return this.service.updateAddresses(input, { dryRun })
  }
}
