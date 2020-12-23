import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FilesUrlGenerator } from '../files';
import { PathInterface } from "./path.interface";

@Injectable()
export class PicturesUrlGenerator {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(FilesUrlGenerator) private readonly fileUrlGenerator: FilesUrlGenerator
  ) { }

  getUrl(pathable: PathInterface): string {
    return this.fileUrlGenerator.getUrl(this.config.get('MINIO_PICTURES_BUCKET'), pathable.getPath());
  }
}
