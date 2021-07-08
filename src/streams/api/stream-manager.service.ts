import { StreamsRepository } from '../entities/streams.repository';
import { Inject } from '@nestjs/common';
import { Stream } from '../entities/stream.entity';
import { StreamChunk } from '../entities/stream-chunk.entity';
import * as moment from 'moment';

export class StreamingError implements Error {
  constructor(public name: string, public message: string) {}
}
export default class StreamManager {
  constructor(
    @Inject(StreamsRepository) private readonly repo: StreamsRepository,
  ) {}

  async start(stream: Stream) {
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

    stream.isStreaming = true;
    const chunk = new StreamChunk();
    chunk.isActive = true;
    stream.addChunk(chunk);
    this.repo.save(stream);
  }

  async stop(
    stream: Stream,
    start: string,
    duration: number,
    recordUrl: string,
  ) {
    if (stream.isStreaming != true) {
      throw new StreamingError(
        'StreamingAlreadyStoppedError',
        'Trying to stop a stream that has already been stopped',
      );
    }

    const startDate = moment(start, 'YYYYMMDD-hhmmss');
    stream.isStreaming = false;
    const lastActiveChunk = stream.chunks.find(
      (chunk) => chunk.isActive == true,
    );
    lastActiveChunk.startTime = startDate.toDate();
    lastActiveChunk.endTime = startDate.add(duration, 'seconds').toDate();
    lastActiveChunk.isActive = false;
    lastActiveChunk.url = recordUrl;
    this.repo.save(stream);
  }
}
