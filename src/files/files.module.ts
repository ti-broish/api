import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestMinioModule } from 'nestjs-minio';
import { FilesService } from './files.service';
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
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
