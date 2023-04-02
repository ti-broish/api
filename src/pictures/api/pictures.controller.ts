import {
  Controller,
  Get,
  Post,
  HttpCode,
  Param,
  Body,
  Inject,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { Recaptcha } from '@nestlab/google-recaptcha'
import { Public } from 'src/auth/decorators'
import { Action } from 'src/casl/action.enum'
import { AppAbility } from 'src/casl/casl-ability.factory'
import { CheckPolicies } from 'src/casl/check-policies.decorator'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { InjectUser } from '../../auth/decorators/inject-user.decorator'
import { User } from '../../users/entities'
import { Picture } from '../entities/picture.entity'
import { PicturesRepository } from '../entities/pictures.repository'
import { PicturesUploader } from '../pictures-uploader.service'
import { PicturesUrlGenerator } from '../pictures-url-generator.service'
import { PictureDto } from './picture.dto'
import { UploadImageDto } from './upload-image.dto'

@Controller('pictures')
@Public()
export class PicturesController {
  constructor(
    @Inject(PicturesUploader)
    private readonly picturesUploader: PicturesUploader,
    @Inject(PicturesRepository) private readonly repo: PicturesRepository,
    @Inject(PicturesUrlGenerator)
    private readonly urlGenerator: PicturesUrlGenerator,
  ) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Picture))
  @UsePipes(new ValidationPipe({ transform: true }))
  async uploadFile(
    @Body() upload: UploadImageDto,
    @InjectUser() user: User | undefined,
  ): Promise<PictureDto> {
    const picture = await this.picturesUploader.upload(upload.image)
    picture.author = user || null

    const pictureDto = PictureDto.fromEntity(await this.repo.save(picture))
    pictureDto.url = this.urlGenerator.getUrl(pictureDto)

    return pictureDto
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Picture))
  async get(@Param('id') id: string): Promise<PictureDto> {
    const picture = await this.repo.findOneOrFail(id)
    const pictureDto = PictureDto.fromEntity(picture)
    pictureDto.url = this.urlGenerator.getUrl(pictureDto)

    return pictureDto
  }
}
