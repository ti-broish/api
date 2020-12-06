import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Party } from './entities/party.entity';
import { PartiesRepository } from './entities/parties.repository';
import { PartiesController } from './api/parties.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Party])],
  providers: [PartiesRepository],
  exports: [PartiesRepository],
  controllers: [PartiesController],
})
export class PartiesModule {}
