import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestMinioModule } from 'nestjs-minio';
import { FilesUrlGenerator, FilesUploader } from '.';
import { MinioConfigService } from './minio.config';

@Module({
  imports: [
    ConfigModule,
    NestMinioModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: MinioConfigService,
    }),
  ],
  providers: [FilesUploader, FilesUrlGenerator],
  exports: [FilesUploader, FilesUrlGenerator],
})
export class FilesModule {}
