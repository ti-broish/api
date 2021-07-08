import {
  Controller,
  Post,
  UseGuards,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { StreamsRepository } from '../entities/streams.repository';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'src/auth/decorators';
import { StreamingError } from './stream-manager.service';
import StreamManager from './stream-manager.service';

@Public()
@UseGuards(AuthGuard('basic'))
@Controller('streams/webhook')
export class StreamsWebhookController {
  constructor(
    private readonly streamsRepo: StreamsRepository,
    private readonly streamingService: StreamManager,
  ) {}

  @Post()
  async webhook(
    @Query('type') type: string,
    @Query('stream') streamId: string,
    @Query('start') start?: string,
    @Query('url') recordUrl?: string,
    @Query('len') len?: string,
  ) {
    const stream = await this.streamsRepo.findOneOrFail(streamId);
    if (type == 'start') {
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
          throw new HttpException('Conflict', HttpStatus.CONFLICT);
        }

        throw e;
      }
    }
    if (type == 'stop') {
      try {
        if (stream.isStreaming != true) {
          throw new StreamingError(
            'StreamingAlreadyStoppedError',
            'Trying to stop a stream that has already been stopped',
          );
        }
        this.streamingService.stop(stream, start, len, recordUrl);
      } catch (e) {
        if (e instanceof StreamingError) {
          throw new HttpException('Conflict', HttpStatus.CONFLICT);
        }

        throw e;
      }
    }
  }
}
