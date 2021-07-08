import { StreamsRepository } from '../entities/streams.repository';
import { Inject } from '@nestjs/common';
import { Stream } from '../entities/stream.entity';
import { StreamChunk } from '../entities/stream-chunk.entity';
import * as moment from 'moment';

export default class StreamManager {
  constructor(
    @Inject(StreamsRepository) private readonly repo: StreamsRepository,
  ) {}

  async start(stream: Stream) {
    stream.start();
    this.repo.save(stream);
  }

  async stop(stream: Stream, start: string, duration: number, url: string) {
    const startDate = moment(start, 'YYYYMMDD-hhmmss');
    stream.stop(
      startDate.toDate(),
      startDate.add(duration, 'seconds').toDate(),
      url,
    );
    this.repo.save(stream);
  }
}
