import { StreamsRepository } from '../entities/streams.repository';
import { Inject } from '@nestjs/common';
import { Stream } from '../entities/stream.entity';
import { StreamChunk } from '../entities/stream-chunk.entity';
import * as moment from 'moment';

export class StreamingError implements Error {
  constructor(public name: string, public message: string) {}
}
export default class StreamingService {
  constructor(
    @Inject(StreamsRepository) private readonly repo: StreamsRepository,
  ) {}

  async start(stream: Stream) {
    stream.isStreaming = true;
    const chunk = new StreamChunk();
    chunk.author = stream.user;
    chunk.isActive = true;
    stream.addChunk(chunk);
    this.repo.save(stream);
  }

  async stop(stream: Stream, start: string, len: string, recordUrl: string) {
    const startDate = moment(start, 'YYYYMMDD-hhmmss');
    stream.isStreaming = false;
    const lastActiveChunk = stream.chunks.find(
      (chunk) => chunk.isActive == true,
    );
    lastActiveChunk.startTime = startDate.toDate();
    lastActiveChunk.endTime = startDate.add(parseInt(len), 'seconds').toDate();
    lastActiveChunk.isActive = false;
    lastActiveChunk.url = recordUrl;
    this.repo.save(stream);
  }
}
