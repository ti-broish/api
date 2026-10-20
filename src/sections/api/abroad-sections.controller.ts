import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { Express } from 'express'
import 'multer'
import { Action } from 'src/casl/action.enum'
import { AppAbility } from 'src/casl/casl-ability.factory'
import { CheckPolicies } from 'src/casl/check-policies.decorator'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { ApiFirebaseAuth } from '../../auth/decorators/ApiFirebaseAuth.decorator'
import {
  AbroadSectionInput,
  AbroadSectionRawRow,
  AbroadSectionsConflictError,
  AbroadSectionsInputError,
  AbroadSectionsService,
  AbroadSectionsUpdateReport,
  normaliseAbroadSections,
  parseAbroadSectionsCsv,
} from '../abroad'
import { Section } from '../entities'

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
 * Replace the abroad sections (election region 32) without touching domestic
 * sections. Admin only.
 */
@Controller('sections/abroad')
@ApiFirebaseAuth()
export class AbroadSectionsController {
  constructor(private readonly service: AbroadSectionsService) {}

  @Put()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Manage, Section))
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description:
      'Either a multipart CSV upload in field "file" (columns: Държава, № на секция, Секционна избирателна комисия; optional Избиратели, Машини) or JSON {"sections": [{"Държава": "…", "№ на секция": "…", "Секционна избирателна комисия": "…"}]}. English keys country / section_id / label / voters / machines are accepted too.',
  })
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: Boolean,
    description: 'Apply in a transaction, report, then roll back',
  })
  @ApiResponse({ status: 200, description: 'Report of what changed' })
  @ApiResponse({ status: 400, description: 'Invalid input; nothing changed' })
  @ApiResponse({
    status: 409,
    description: 'Input conflicts with the database; nothing changed',
  })
  async replace(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { sections?: AbroadSectionRawRow[] } | undefined,
    @Query('dryRun') dryRunParam?: string,
  ): Promise<AbroadSectionsUpdateReport> {
    const dryRun = parseDryRun(dryRunParam)
    let sections: AbroadSectionInput[]
    try {
      if (file) {
        sections = await parseAbroadSectionsCsv(file.buffer)
      } else if (body && Array.isArray(body.sections)) {
        sections = normaliseAbroadSections(body.sections)
      } else {
        throw new AbroadSectionsInputError([
          'send a CSV file in the "file" field or a JSON body {"sections": [...]}',
        ])
      }
    } catch (e) {
      if (e instanceof AbroadSectionsInputError) {
        throw new BadRequestException({ message: e.message, errors: e.errors })
      }
      throw e
    }

    try {
      return await this.service.replace(sections, { dryRun })
    } catch (e) {
      if (e instanceof AbroadSectionsConflictError) {
        throw new ConflictException(e.message)
      }
      throw e
    }
  }
}
