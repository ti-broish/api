import { Controller, Get, Post, HttpCode, Query, Param, Body, Inject, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectUser } from '../../auth/decorators/injectUser.decorator';
import { User } from '../../users/entities';
import { Picture } from '../entities/picture.entity';
import { PicturesRepository } from '../entities/pictures.repository';
import { PicturesService } from '../pictures.service';
import { PictureDto } from './picture.dto';
import { UploadImageDto } from './upload-image.dto';

@Controller('pictures')
export class PicturesController {

  constructor(
    @Inject(PicturesService) private readonly picturesService: PicturesService,
    @Inject(PicturesRepository) private readonly repo: PicturesRepository
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async uploadFile(@Body() upload: UploadImageDto, @InjectUser() user: User): Promise<PictureDto> {
    let picture = await this.picturesService.upload(upload.image);
    picture.author = user;
    picture = await this.repo.save(picture);
    const pictureDto = PictureDto.fromEntity(picture);
    pictureDto.url = this.picturesService.pictureUrl(picture);

    return pictureDto;
  }

  @Get()
  @HttpCode(200)
  query(@Query('protocol') protocol?: string, @Query('report') report?: string): Array<Picture> {
    return [];
  }

  @Get(':id')
  @HttpCode(200)
  async get(@Param('id') id: string): Promise<PictureDto> {
    const picture = await this.repo.findOneOrFail(id);
    const pictureDto = PictureDto.fromEntity(picture);
    pictureDto.url = this.picturesService.pictureUrl(picture);

    return pictureDto;
  }
}

