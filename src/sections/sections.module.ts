import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectionsRepository, CountriesRepository } from './entities/repositories';
import { SectionsController, CountriesController, ElectionRegionsController, TownsController } from './api/controllers';
import { Section, Country, ElectionRegion, Town, Municipality } from './entities';
import { ElectionRegionsRepository } from './entities/electionRegions.repository';
import { TownsRepository } from './entities/towns.repository';
import { IsSectionExistsConstraint } from './api/section-exists.constraint';
import { IsTownExistsConstraint } from './api/town-exists.constraint';
import { CaslModule } from 'src/casl/casl.module';

@Module({
  imports: [TypeOrmModule.forFeature([Section, Town, Municipality, ElectionRegion, Country]), CaslModule],
  providers: [SectionsRepository, CountriesRepository, ElectionRegionsRepository, TownsRepository, IsSectionExistsConstraint, IsTownExistsConstraint],
  exports: [SectionsRepository],
  controllers: [SectionsController, CountriesController, ElectionRegionsController, TownsController],
})
export class SectionsModule {}
