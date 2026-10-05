import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { AbroadSectionInput } from './abroad-sections.parser'
import {
  AbroadSectionsUpdateReport,
  updateAbroadSections,
} from './abroad-sections.updater'

@Injectable()
export class AbroadSectionsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  replace(
    sections: AbroadSectionInput[],
    options: { dryRun?: boolean } = {},
  ): Promise<AbroadSectionsUpdateReport> {
    return updateAbroadSections(this.dataSource, sections, options)
  }
}
