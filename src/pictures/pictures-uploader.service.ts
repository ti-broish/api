import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FilesUploader } from '../files'
import { Picture } from './entities/picture.entity'
import * as fs from 'fs'

@Injectable()
export class PicturesUploader {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(FilesUploader) private readonly uploader: FilesUploader,
  ) {}

  deletePictureFromLocal(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.unlink(path, (err) => {
        if (err) {
          reject(err)
        }
        resolve('Deleted file successfully!')
      })
    })
  }

  async upload(base64EncodedFile: string): Promise<Picture> {
    const picture = new Picture()
    picture.path = await this.uploader.uploadFileToCdn(
      await this.uploader.base64ToLocalFilePath(base64EncodedFile),
    )
    await this.deletePictureFromLocal(picture.path)
    return picture
  }
}
