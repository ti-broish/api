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
  @CheckPolicies((ability: Ability) => ability.can(Action.Delete, Stream))
  async delete(@Param('stream') stream_id: string): Promise<StreamDto> {
    const stream = await this.streamsRepo.findOneOrFail(stream_id);
    const user = await this.usersRepo.findOneOrFail(stream.user.id);
    user.roles.splice(user.roles.indexOf(Role.Streamer), 1);
    const updatedUser = this.usersRepo.update(user);
    stream.isCensored = true;
    const updatedStream = this.streamsRepo.save(stream);
    const url_stop = 'https://stest.tibroish.bg/stop.php?name=${stream_id}';

    this.httpService.post(url_stop);

    return new StreamDto();
  }
}
