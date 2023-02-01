import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FilesUploader } from '../files'
import { Picture } from './entities/picture.entity'

@Injectable()
export class PicturesUploader {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(FilesUploader) private readonly uploader: FilesUploader,
  ) {}

  async upload(base64EncodedFile: string): Promise<Picture> {
    const picture = new Picture()
    picture.path = await this.uploader.uploadFileToCdn(
      await this.uploader.base64ToLocalFilePath(base64EncodedFile),
    )

    return picture
  }
}
