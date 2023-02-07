import { Controller, Get, HttpCode } from '@nestjs/common'

import { PictureDto } from 'src/pictures/api/picture.dto'
import { Violation } from 'src/violations/entities/violation.entity'
import { InjectUser } from '../../auth/decorators/inject-user.decorator'
import { PicturesUrlGenerator } from '../../pictures/pictures-url-generator.service'
import { ViolationDto } from '../../violations/api/violation.dto'
import { ViolationsRepository } from '../../violations/entities/violations.repository'
import { User } from '../../users/entities/user.entity'

@Controller('me/violations')
export class MeViolationController {
  constructor(
    private readonly violationsRepo: ViolationsRepository,
    private readonly picturesUrlGenerator: PicturesUrlGenerator,
  ) {}

  @Get()
  @HttpCode(200)
  // @UseGuards(PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Violation))
  async index(@InjectUser() user: User): Promise<ViolationDto[]> {
    const violations = (await this.violationsRepo.findByAuthor(user)).map(
      (violation: Violation): ViolationDto =>
        ViolationDto.fromEntity(violation),
    )
    violations.forEach(
      (dto) => dto.pictures.forEach(this.updatePictureUrl, this),
      this,
    )

    return violations
  }

  private updatePictureUrl(picture: PictureDto): void {
    picture.url = this.picturesUrlGenerator.getUrl(picture)
  }
}
