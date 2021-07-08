import { Controller, Post, UseGuards, ConflictException } from '@nestjs/common';
import { StreamsRepository } from '../entities/streams.repository';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'src/auth/decorators';
import StreamManager from './stream-manager.service';
import { Body } from '@nestjs/common';
import { StreamWebhookDto } from './stream-webhook.dto';
import { StreamingError } from '../entities/stream.entity';

@Public()
@UseGuards(AuthGuard('basic'))
@Controller('streams/webhook')
export class StreamsWebhookController {
  constructor(
    private readonly streamsRepo: StreamsRepository,
    private readonly streamingService: StreamManager,
  ) {}

  @Post()
  async webhook(@Body() webhook: StreamWebhookDto) {
    const stream = await this.streamsRepo.findOneByIdentifierOrFail(
      webhook.identifier,
    );
    if (webhook.type == StreamWebhookDto.START) {
      try {
        this.streamingService.start(stream);
      } catch (e) {
        if (e instanceof StreamingError) {
          throw new ConflictException(e.message);
        }

        throw e;
      }
    }
    if (webhook.type == StreamWebhookDto.STOP) {
      try {
        this.streamingService.stop(
          stream,
          webhook.start,
          webhook.duration,
          webhook.url,
        );
      } catch (e) {
        if (e instanceof StreamingError) {
          throw new ConflictException(e.message);
        }

        throw e;
      }
    }
  }
}
