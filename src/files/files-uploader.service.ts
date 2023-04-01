import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as base64Img from 'base64-img'
import { MINIO_CONNECTION } from 'nestjs-minio'
import { ulid } from 'ulid'
import { Client as MinioClient } from 'minio'
import * as mime from 'mime-types'
import * as path from 'path'
import * as fs from 'fs'

@Injectable()
export class FilesUploader {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(MINIO_CONNECTION) private readonly minioClient: MinioClient,
  ) {}

  base64ToLocalFilePath(base64EncodedFile: string): Promise<string> {
    return new Promise((resolve, reject) => {
      base64Img.img(
        base64EncodedFile,
        this.config.get('UPLOADS_PATH'),
        ulid(),
        (error: Error, fullPath: string) => {
          if (error) {
            reject(error)
            return
          }
          resolve(fullPath)
        },
      )
    })
  }

  async uploadFileToCdn(filePath: string, bucket?: string): Promise<string> {
    const pathArr = filePath.split('/')
    const fileName = pathArr[pathArr.length - 1]
    const absolutePath = filePath.startsWith('/')
      ? filePath
      : path.resolve(filePath)
    await this.minioClient.fPutObject(
      bucket || this.config.get('MINIO_PICTURES_BUCKET'),
      fileName,
      absolutePath,
      {
        'Content-Type': mime.lookup(fileName) || 'application/octet-stream',
      },
    )

    try {
      void this.deleteLocalFile(absolutePath)
    } catch (err) {
      console.error(err)
    }

    return fileName
  }

  private deleteLocalFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.unlink(path, (err) => {
        if (!err) {
          resolve(path)
          return
        }
        reject(err)
      })
    })
  }
}
