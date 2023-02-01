import {
  Controller,
  HttpCode,
  Body,
  UsePipes,
  ValidationPipe,
  Post,
} from '@nestjs/common'
import { CheckinDto } from 'src/checkins/api/checkin.dto'
import { CheckinsRepository } from 'src/checkins/entities/checkins.repository'
import { InjectUser } from '../../auth/decorators/inject-user.decorator'
import { User } from '../../users/entities/user.entity'

@Controller('me/checkins')
export class MeCheckinsController {
  constructor(private readonly checkinsRepo: CheckinsRepository) {}

  @Post()
  @HttpCode(201)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['create'] },
      groups: ['create'],
    }),
  )
  async checkin(
    @InjectUser() user: User,
    @Body() checkinDto: CheckinDto,
  ): Promise<CheckinDto> {
    const client = checkinDto.toEntity()
    client.actor = user

    return CheckinDto.fromEntity(await this.checkinsRepo.save(client))
  }
}
