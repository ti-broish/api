import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'src/casl/casl.module';
import { PicturesModule } from '../pictures/pictures.module';
import { ViolationsController } from './api/violations.controller';
import { Violation } from './entities/violation.entity';
import { ViolationsRepository } from './entities/violations.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Violation]), CaslModule, PicturesModule],
  controllers: [ViolationsController],
  providers: [ViolationsRepository],
  exports: [ViolationsRepository],
})
export class ViolationsModule {}
