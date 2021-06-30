import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'src/casl/casl.module';
import { Checkin } from './entities/checkin.entity';
import { CheckinsRepository } from './entities/checkins.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Checkin]), CaslModule],
  providers: [CheckinsRepository],
  exports: [CheckinsRepository],
  controllers: [],
})
export class CheckinsModule {}
