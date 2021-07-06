import { Ability } from '@casl/ability';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Param,
  Inject,
} from '@nestjs/common';
import { HttpService } from '@nestjs/common';
import { startWith } from 'rxjs/operators';
import { InjectUser } from 'src/auth/decorators';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { SectionsRepository } from 'src/sections/entities/sections.repository';
import { User } from 'src/users/entities';
import { UsersRepository } from 'src/users/entities/users.repository';
import { Stream } from '../entities/stream.entity';
import { StreamsRepository } from '../entities/streams.repository';
import { StreamDto } from './stream.dto';
import { Role } from '../../casl/role.enum';
import { ConfigService } from '@nestjs/config';

@Controller('streams')
export class StreamsController {
  constructor(
    private readonly streamsRepo: StreamsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly sectionsRepo: SectionsRepository,
    private httpService: HttpService,
  ) {}

  @Post()
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Create, Stream))
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: [StreamDto.CREATE] },
      groups: [StreamDto.CREATE],
    }),
  )
  async create(
    @Body() streamDto: StreamDto,
    @InjectUser() user: User,
  ): Promise<StreamDto> {
    const stream = await this.streamsRepo.findAvailableStreamOrFail();
    const section = await this.sectionsRepo.findOneOrFailWithRelations(
      streamDto.toEntity().section.id,
    );
    stream.assign(user, section);
    await this.usersRepo.save(user);

    return StreamDto.fromEntity(stream, ['read', StreamDto.READ]);
  }

  @Delete(':stream')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Manage, Stream))
  async delete(
    @Param('stream') streamId: string,
    @Inject(ConfigService) config: ConfigService,
  ): Promise<StreamDto> {
    const stream = await this.streamsRepo.findOneOrFail(streamId);
    const index = stream.user.roles.indexOf(Role.Streamer);
    if (index > 0) {
      stream.user.roles.splice(index, 1);
      await this.usersRepo.save(stream.user);
    }
    stream.isCensored = true;

    await this.streamsRepo.save(stream);
    const streamUrl = stream.streamUrl.substring(
      stream.streamUrl.indexOf('/') + 2,
    );
    const streamServer = streamUrl.substring(0, streamUrl.indexOf('.'));
    const secret = encodeURIComponent(
      config.get<string>('STREAM_REJECT_SECRET'),
    );
    const stopUrl = `https://${streamServer}.tibroish.bg/stop.php?name=${stream.identifier}&secret=${secret}`;
    this.httpService.post(stopUrl);

    return StreamDto.fromEntity(stream);
  }
}
