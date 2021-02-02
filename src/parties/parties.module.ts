import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Party } from './entities/party.entity';
import { PartiesRepository } from './entities/parties.repository';
import { PartiesController } from './api/parties.controller';
import { IsPartyExistsConstraint } from './api/party-exists.constraint';
import { CaslModule } from 'src/casl/casl.module';

@Module({
  imports: [TypeOrmModule.forFeature([Party]), CaslModule],
  providers: [PartiesRepository, IsPartyExistsConstraint],
  exports: [PartiesRepository],
  controllers: [PartiesController],
})
export class PartiesModule {}
