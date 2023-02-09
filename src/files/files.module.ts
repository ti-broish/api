import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { NestMinioModule, NestMinioOptions } from 'nestjs-minio'
import { FilesUrlGenerator, FilesUploader } from '.'

@Module({
  imports: [
    ConfigModule,
    NestMinioModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        ({
          endPoint: configService.get('MINIO_ENDPOINT'),
          port: configService.get('MINIO_PORT'),
          useSSL: configService.get<boolean>('MINIO_SSL'),
          accessKey: configService.get('MINIO_ACCESS_KEY'),
          secretKey: configService.get('MINIO_SECRET_KEY'),
          password: configService.get<string>('DATABASE_PASSWORD'),
        } as NestMinioOptions),
    }),
  ],
  providers: [FilesUploader, FilesUrlGenerator],
  exports: [FilesUploader, FilesUrlGenerator],
})
export class FilesModule {}
