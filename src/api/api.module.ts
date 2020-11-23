import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations/organizations.controller';
import { PicturesController } from './pictures/pictures.controller';
import { ProtocolsController } from './protocols/protocols.controller';
import { CityRegionsController } from './sections/cityRegions/cityRegions.controller';
import { CountriesController } from './sections/countries/countries.controller';
import { ElectionRegionsController } from './sections/electionRegions/electionRegions.controller';
import { MunicipalitiesController } from './sections/municipalities/municipalities.controller';
import { SectionsController } from './sections/sections/sections.controller';
import { TownsController } from './sections/towns/towns.controller';
import { UsersController } from './users/users.controller';

@Module({
  controllers: [
    CityRegionsController,
    CountriesController,
    ElectionRegionsController,
    MunicipalitiesController,
    OrganizationsController,
    PicturesController,
    ProtocolsController,
    SectionsController,
    TownsController,
    UsersController,
  ],
})
export class ApiModule {}
