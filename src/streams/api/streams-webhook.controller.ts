import {
  Controller,
  Post,
  UseGuards,
  ConflictException,
  UsePipes,
  ValidationPipe,
  HttpCode,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Public } from 'src/auth/decorators'
import StreamManager from './stream-manager.service'
import { Body } from '@nestjs/common'
import { StreamEventDto } from './stream-event.dto'
import { StreamingError } from '../entities/stream.entity'
import {
  AcceptedResponse,
  ACCEPTED_RESPONSE_STATUS,
} from 'src/utils/accepted-response'

@Public()
@UseGuards(AuthGuard('basic'))
@Controller('streams/webhook')
export class StreamsWebhookController {
  constructor(private readonly streamManager: StreamManager) {}

  @Post()
  @HttpCode(202)
  @UsePipes(new ValidationPipe({ transform: true }))
  async webhook(@Body() webhook: StreamEventDto): Promise<AcceptedResponse> {
    try {
      await this.streamManager.processStreamEvent(webhook)
    } catch (error) {
      if (error instanceof StreamingError) {
        throw new ConflictException(error.message)
      }

      throw error
    }

    return { status: ACCEPTED_RESPONSE_STATUS }
  }
}
