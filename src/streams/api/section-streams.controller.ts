import { Controller, HttpCode, Param } from '@nestjs/common';
import { Public } from 'src/auth/decorators';
import { Stream } from '../entities/stream.entity';
import { StreamsRepository } from '../entities/streams.repository';
import { StreamDto } from './stream.dto';

@Controller('sections/:section/streams')
export class SectionStreamsController {
  constructor(private readonly streamsRepo: StreamsRepository) {}

  @Public()
  @HttpCode(200)
  async getStreams(
    @Param('section') sectionCode?: string,
  ): Promise<StreamDto[]> {
    const streamsInSection = await this.streamsRepo.findBySection(sectionCode);

    return streamsInSection.map(
      (stream: Stream): StreamDto =>
        StreamDto.fromEntity(stream, [StreamDto.WATCH]),
    );
  }
}
