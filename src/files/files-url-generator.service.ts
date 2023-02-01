import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class FilesUrlGenerator {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  getUrl(bucketName: string, filePath: string): string {
    return `https://${this.config.get(
      'MINIO_ENDPOINT',
    )}/${bucketName}/${filePath}`
  }
}
