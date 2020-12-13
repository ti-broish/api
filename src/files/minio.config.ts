import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestMinioOptions, NestMinioOptionsFactory } from 'nestjs-minio';

@Injectable()
export class MinioConfigService implements NestMinioOptionsFactory {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async createNestMinioOptions(): Promise<NestMinioOptions> {
    return {
      endPoint: this.config.get('MINIO_ENDPOINT'),
      port: this.config.get('MINIO_PORT'),
      useSSL: true,
      accessKey: this.config.get('MINIO_ACCESS_KEY'),
      secretKey: this.config.get('MINIO_SECRET_KEY'),
      password: this.config.get('DATABASE_PASSWORD'),
    } as NestMinioOptions;
  }
}
