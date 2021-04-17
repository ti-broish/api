import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Picture } from './entities/picture.entity';
import { PicturesRepository } from './entities/pictures.repository';
import { PicturesController } from './api/pictures.controller';
import { FilesModule } from '../files';
import { PicturesUploader } from './pictures-uploader.service';
import { PicturesUrlGenerator } from './pictures-url-generator.service';
import { IsPictureExistsConstraint } from './api/picture-exists.constraint';
import { CaslModule } from 'src/casl/casl.module';

@Module({
  imports: [
    ConfigModule,
    FilesModule,
    TypeOrmModule.forFeature([Picture]),
    CaslModule,
  ],
  providers: [
    PicturesRepository,
    PicturesUploader,
    PicturesUrlGenerator,
    IsPictureExistsConstraint,
  ],
  exports: [PicturesRepository, PicturesUrlGenerator],
  controllers: [PicturesController],
})
export class PicturesModule {}
