import { Controller, Post, UseGuards, ConflictException } from '@nestjs/common';
import { StreamsRepository } from '../entities/streams.repository';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'src/auth/decorators';
import { StreamingError } from './stream-manager.service';
import StreamManager from './stream-manager.service';
import { Body } from '@nestjs/common';
import { StreamWebhookDto } from './stream-webhook.dto';

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
        if (stream.isStreaming != false) {
          throw new StreamingError(
            'StreamingAlreadyStoppedError',
            'Trying to start a stream that has already been started',
          );
        }
        if (stream.isCensored != false) {
          throw new StreamingError(
            'StreamingIsCensoredError',
            'Cannot start censored stream',
          );
        }
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
        if (stream.isStreaming != true) {
          throw new StreamingError(
            'StreamingAlreadyStoppedError',
            'Trying to stop a stream that has already been stopped',
          );
        }
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
