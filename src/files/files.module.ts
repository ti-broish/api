import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Client as MinioClient } from 'minio'
import { MINIO_CONNECTION } from 'nestjs-minio'
import { FilesUrlGenerator, FilesUploader } from '.'
import { MinioConnectionCheck } from './minio-connection-check.service'

@Module({
  imports: [ConfigModule],
  providers: [
    {
      // Not NestMinioModule: it lists the buckets on start and refuses to boot when
      // the storage is unreachable, which takes the whole API down with it.
      provide: MINIO_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new MinioClient({
          endPoint: config.get('MINIO_ENDPOINT'),
          port: config.get<number>('MINIO_PORT'),
          useSSL: config.get<boolean>('MINIO_SSL'),
          accessKey: config.get('MINIO_ACCESS_KEY'),
          secretKey: config.get('MINIO_SECRET_KEY'),
        }),
    },
    MinioConnectionCheck,
    FilesUploader,
    FilesUrlGenerator,
  ],
  exports: [MINIO_CONNECTION, FilesUploader, FilesUrlGenerator],
})
export class FilesModule {}
