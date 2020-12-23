import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as base64Img from 'base64-img';
import { MINIO_CONNECTION } from 'nestjs-minio';
import { ulid } from 'ulid';
import { Client as MinioClient } from 'minio';
import * as mime from 'mime-types';
import * as path from 'path';

@Injectable()
export class FilesUrlGenerator {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  getUrl(bucketName: string, filePath: string): string {
    return `https://${this.config.get('MINIO_ENDPOINT')}/${bucketName}/${filePath}`;
  }
}
