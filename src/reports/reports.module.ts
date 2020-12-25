import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PicturesModule } from 'src/pictures/pictures.module';
import { ReportsController } from './api/reports.controller';
import { Report } from './entities/report.entity';
import { ReportssRepository } from './entities/reports.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Report]), PicturesModule],
  controllers: [ReportsController],
  providers: [ReportssRepository],
  exports: [ReportssRepository],
})
export class ReportsModule {}
