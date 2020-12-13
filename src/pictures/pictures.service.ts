import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FilesService } from "src/files";
import { Picture } from "./entities/picture.entity";

@Injectable()
export class PicturesService {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(FilesService) private readonly filesService: FilesService
  ) { }

  async upload(base64EncodedFile: string): Promise<Picture> {
    const picture = new Picture();
    picture.path = await this.filesService.uploadFileToCdn(
      await this.filesService.base64ToLocalFilePath(base64EncodedFile)
    );

    return picture;
  }

  pictureUrl(picture: Picture): string {
    return this.filesService.fileUrl(this.config.get('MINIO_PICTURES_BUCKET'), picture.path);
  }
}
