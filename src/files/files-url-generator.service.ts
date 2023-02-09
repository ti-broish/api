import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class FilesUrlGenerator {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  getUrl(bucketName: string, filePath: string): string {
    return `${this.config.get<string>('MINIO_URL')}/${bucketName}/${filePath}`
  }
}
