import { StreamsRepository } from '../entities/streams.repository';
import { Inject } from '@nestjs/common';
import { Stream } from '../entities/stream.entity';
import { StreamEventDto } from './stream-event.dto';

export default class StreamManager {
  constructor(
    @Inject(StreamsRepository) private readonly repo: StreamsRepository,
  ) {}

  async processStreamEvent(event: StreamEventDto): Promise<Stream> {
    const stream = await this.repo.findOneByIdentifierOrFail(event.identifier);

    if (event.type === StreamEventDto.START) {
      return this.start(stream);
    }

    if (event.type === StreamEventDto.STOP) {
      return this.stop(stream, event.start, event.end, event.url);
    }

    throw new Error(`Unsupported streaming event: ${event.type}`);
  }

  async start(stream: Stream): Promise<Stream> {
    stream.start();

    return this.repo.save(stream);
  }

  async stop(
    stream: Stream,
    start: Date,
    end: Date,
    url: string,
  ): Promise<Stream> {
    stream.stop(start, end, url);

    return this.repo.save(stream);
  }
}
