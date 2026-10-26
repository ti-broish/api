import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { AbroadAddressInput } from './abroad-addresses.parser'
import {
  AbroadAddressesReport,
  updateAbroadAddresses,
} from './abroad-addresses.updater'
import {
  AbroadSectionListItem,
  listAbroadSections,
} from './abroad-sections.list'

@Injectable()
export class AbroadAddressesService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  list(): Promise<AbroadSectionListItem[]> {
    return listAbroadSections(this.dataSource)
  }

  updateAddresses(
    input: AbroadAddressInput[],
    options: { dryRun?: boolean } = {},
  ): Promise<AbroadAddressesReport> {
    return updateAbroadAddresses(this.dataSource, input, options)
  }
}
