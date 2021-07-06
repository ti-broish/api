import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { Stream } from '../entities/stream.entity';
import { Role } from '../../casl/role.enum';
import * as util from 'util';
import { StreamsRepository } from '../entities/streams.repository';
import { UsersRepository } from 'src/users/entities/users.repository';

@Injectable()
export class StreamCensor {
  private readonly STOP_URL_FORMAT: string =
    '%s//%s/stop.php?name=%s&secret=%s';

  constructor(
    private readonly streamsRepo: StreamsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly config: ConfigService,
    private httpService: HttpService,
  ) {}

  async censorStreamById(streamId: string) {
    this.censorStream(await this.streamsRepo.findOneOrFail(streamId));
  }

  async censorStream(stream: Stream) {
    if (stream.user) {
      const index = stream.user.roles.indexOf(Role.Streamer);
      if (index >= 0) {
        stream.user.roles.splice(index, 1);
        await this.usersRepo.save(stream.user);
      }
    }
    stream.isCensored = true;

    await this.streamsRepo.save(stream);
    this.stopStream(stream);
  }

  private stopStream(stream: Stream): Observable<AxiosResponse<any>> {
    const streamUrl = new URL(stream.broadcastUrl);
    const secret = encodeURIComponent(
      this.config.get<string>('STREAM_REJECT_SECRET'),
    );
    const stopUrl = util.format(
      this.STOP_URL_FORMAT,
      streamUrl.protocol,
      streamUrl.hostname,
      stream.identifier,
      secret,
    );

    return this.httpService.post(stopUrl);
  }
}
