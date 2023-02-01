import {
  Controller,
  Get,
  HttpCode,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { PictureDto } from 'src/pictures/api/picture.dto'
import { Protocol } from 'src/protocols/entities/protocol.entity'
import { InjectUser } from '../../auth/decorators/inject-user.decorator'
import { PicturesUrlGenerator } from '../../pictures/pictures-url-generator.service'
import {
  ProtocolDto,
  ProtocolStatusOverride,
} from '../../protocols/api/protocol.dto'
import { ProtocolsRepository } from '../../protocols/entities/protocols.repository'
import { User } from '../../users/entities/user.entity'

@Controller('me/protocols')
export class MeProtocolsController {
  constructor(
    private readonly protocolsRepo: ProtocolsRepository,
    private readonly picturesUrlGenerator: PicturesUrlGenerator,
  ) {}

  @Get()
  @HttpCode(200)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: Ability) => ability.can(Action.Read, Protocol))
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(@InjectUser() user: User): Promise<ProtocolDto[]> {
    const protocols = await this.protocolsRepo.findByAuthor(user)
    return protocols.map((protocol: Protocol): ProtocolDto => {
      const protocolDto = ProtocolDto.fromEntity(protocol)
      protocolDto.pictures.forEach(this.updatePictureUrl, this)
      protocolDto.status = ProtocolStatusOverride.PROCESSED

      return protocolDto
    })
  }

  private updatePictureUrl(picture: PictureDto): void {
    picture.url = this.picturesUrlGenerator.getUrl(picture)
  }
}
