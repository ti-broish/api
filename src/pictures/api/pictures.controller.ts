import { Controller, Get, Post, HttpCode, Query, Param, Body, Inject, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { User } from '../../users/entities';
import { Picture } from '../entities/picture.entity';
import { PicturesRepository } from '../entities/pictures.repository';
import { PicturesUploader } from '../pictures-uploader.service';
import { PicturesUrlGenerator } from '../pictures-url-generator.service';
import { PictureDto } from './picture.dto';
import { UploadImageDto } from './upload-image.dto';

@Controller('pictures')
export class PicturesController {

  constructor(
    @Inject(PicturesUploader) private readonly picturesUploader: PicturesUploader,
    @Inject(PicturesRepository) private readonly repo: PicturesRepository,
    @Inject(PicturesUrlGenerator) private readonly urlGenerator: PicturesUrlGenerator,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async uploadFile(@Body() upload: UploadImageDto, @InjectUser() user: User): Promise<PictureDto> {
    let picture = await this.picturesUploader.upload(upload.image);
    picture.author = user;

    const pictureDto = PictureDto.fromEntity(await this.repo.save(picture));
    pictureDto.url = this.urlGenerator.getUrl(pictureDto);

    return pictureDto;
  }

  @Get(':id')
  @HttpCode(200)
  async get(@Param('id') id: string): Promise<PictureDto> {
    const picture = await this.repo.findOneOrFail(id);
    const pictureDto = PictureDto.fromEntity(picture);
    pictureDto.url = this.urlGenerator.getUrl(pictureDto);

    return pictureDto;
  }
}

