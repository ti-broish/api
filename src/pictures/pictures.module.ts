import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Picture } from './entities/picture.entity';
import { PicturesRepository } from './entities/pictures.repository';
import { PicturesController } from './api/pictures.controller';
import { FilesModule } from '../files';
import { PicturesService } from './pictures.service';

@Module({
  imports: [ConfigModule, FilesModule, TypeOrmModule.forFeature([Picture])],
  providers: [PicturesRepository, PicturesService],
  exports: [PicturesRepository],
  controllers: [PicturesController],
})
export class PicturesModule {}
