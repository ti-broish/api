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
  Get,
  Query,
} from '@nestjs/common';
import { InjectUser, Public } from 'src/auth/decorators';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { SectionsRepository } from 'src/sections/entities/sections.repository';
import { User } from 'src/users/entities';
import { UsersRepository } from 'src/users/entities/users.repository';
import { Stream } from '../entities/stream.entity';
import { StreamsRepository } from '../entities/streams.repository';
import { StreamDto } from './stream.dto';
import {
  AcceptedResponse,
  ACCEPTED_RESPONSE_STATUS,
} from 'src/utils/accepted-response';
import { StreamCensor } from './stream-censor.service';

@Controller('streams')
export class StreamsController {
  constructor(
    private readonly streamsRepo: StreamsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly sectionsRepo: SectionsRepository,
    private readonly streamCensor: StreamCensor,
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
  @HttpCode(202)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Manage, Stream))
  delete(@Param('stream') streamId: string): AcceptedResponse {
    this.streamCensor.censorStreamById(streamId);

    return { status: ACCEPTED_RESPONSE_STATUS };
  }

  @Public()
  @Get('feed')
  @HttpCode(200)
  async feed(@Query('after') after?: string): Promise<StreamDto[]> {
    return (await this.streamsRepo.findPublishedViolations(after)).map(
      (stream: Stream) => StreamDto.fromEntity(stream, [StreamDto.FEED]),
    );
  }
}
