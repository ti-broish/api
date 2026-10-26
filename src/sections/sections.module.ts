import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import {
  SectionsRepository,
  CountriesRepository,
} from './entities/repositories'
import {
  SectionsController,
  CountriesController,
  ElectionRegionsController,
  TownsController,
} from './api/controllers'
import {
  Section,
  Country,
  ElectionRegion,
  Town,
  Municipality,
  CityRegion,
} from './entities'
import { ElectionRegionsRepository } from './entities/electionRegions.repository'
import { TownsRepository } from './entities/towns.repository'
import { IsSectionExistsConstraint } from './api/section-exists.constraint'
import { IsTownExistsConstraint } from './api/town-exists.constraint'
import { CaslModule } from 'src/casl/casl.module'
import { MunicipalitiesRepository } from './entities/municipalities.repository'
import { CityRegionsRepository } from './entities/cityRegions.repository'
import { AbroadAddressesController } from './api/abroad-addresses.controller'
import { AbroadAddressesService } from './abroad-addresses'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Section,
      Town,
      Municipality,
      ElectionRegion,
      Country,
      CityRegion,
    ]),
    CaslModule,
  ],
  providers: [
    SectionsRepository,
    CountriesRepository,
    ElectionRegionsRepository,
    MunicipalitiesRepository,
    TownsRepository,
    IsSectionExistsConstraint,
    IsTownExistsConstraint,
    CityRegionsRepository,
    AbroadAddressesService,
  ],
  exports: [
    SectionsRepository,
    ElectionRegionsRepository,
    MunicipalitiesRepository,
    CountriesRepository,
    CityRegionsRepository,
    TownsRepository,
  ],
  controllers: [
    // Before SectionsController, whose GET :section would take /sections/abroad.
    AbroadAddressesController,
    SectionsController,
    CountriesController,
    ElectionRegionsController,
    TownsController,
  ],
})
export class SectionsModule {}
