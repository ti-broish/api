import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common'
import { Client as MinioClient } from 'minio'
import { MINIO_CONNECTION } from 'nestjs-minio'

/**
 * Checks the picture storage once the app has started. A failure is logged as a
 * warning instead of stopping the API: only picture uploads need the storage.
 */
@Injectable()
export class MinioConnectionCheck implements OnApplicationBootstrap {
  private readonly logger = new Logger(MinioConnectionCheck.name)

  constructor(@Inject(MINIO_CONNECTION) private readonly minio: MinioClient) {}

  onApplicationBootstrap(): void {
    void this.check()
  }

  async check(): Promise<boolean> {
    try {
      await this.minio.listBuckets()
      return true
    } catch (error) {
      this.logger.warn(
        `Picture storage is unreachable, uploads will fail: ${
          (error as Error)?.message ?? error
        }`,
      )
      return false
    }
  }
}
