import { Ability } from '@casl/ability'
import {
  Controller,
  Get,
  HttpCode,
  ConflictException,
  Post,
  UseGuards,
} from '@nestjs/common'
import { Action } from 'src/casl/action.enum'
import { CheckPolicies } from 'src/casl/check-policies.decorator'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { InjectUser } from '../../auth/decorators/inject-user.decorator'
import { User } from '../../users/entities/user.entity'
import { ApiResponse } from '@nestjs/swagger'
import { StreamsRepository } from 'src/streams/entities/streams.repository'
import { StreamDto } from 'src/streams/api/stream.dto'
import { Stream } from 'src/streams/entities/stream.entity'

@Controller('me/stream')
export class MeStreamController {
  constructor(private readonly streamsRepo: StreamsRepository) {}

  @Get()
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'You can use the stream to send in video',
  })
  @ApiResponse({
    status: 401,
    description: 'You have not authenticated properly',
  })
  @ApiResponse({ status: 403, description: 'You are not allowed to stream' })
  @ApiResponse({
    status: 409,
    description:
      'You cannot stream yet - you should either select a section first or wait for the end of election day',
  })
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Create, Stream))
  async stream(@InjectUser() user: User): Promise<StreamDto> {
    const stream = await this.streamsRepo.findForUser(user)

    if (!stream) {
      throw new ConflictException('STREAM_NOT_ASSIGNED_STREAM')
    }

    return StreamDto.fromEntity(stream)
  }

  @Post('start')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Create, Stream))
  streamStart(): void {
    // TODO
  }

  @Post('stop')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Create, Stream))
  streamStop(): void {
    // TODO
  }
}
