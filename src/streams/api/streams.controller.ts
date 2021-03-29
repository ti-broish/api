import { Ability } from "@casl/ability";
import { Body, Controller, HttpCode, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { InjectUser } from "src/auth/decorators";
import { Action } from "src/casl/action.enum";
import { CheckPolicies } from "src/casl/check-policies.decorator";
import { PoliciesGuard } from "src/casl/policies.guard";
import { SectionsRepository } from "src/sections/entities/sections.repository";
import { User } from "src/users/entities";
import { UsersRepository } from "src/users/entities/users.repository";
import { Stream } from "../entities/stream.entity";
import { StreamsRepository } from "../entities/streams.repository";
import { StreamDto } from "./stream.dto";

@Controller('streams')
export class StreamsController {
  constructor(
    private readonly streamsRepo: StreamsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly sectionsRepo: SectionsRepository,
  ) { }

  @Post()
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Create, Stream))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: [StreamDto.CREATE] }, groups: [StreamDto.CREATE] }))
  async create(
    @Body() streamDto: StreamDto,
    @InjectUser() user: User,
  ): Promise<StreamDto> {
    const stream = await this.streamsRepo.findAvailableStreamOrFail();
    const section = await this.sectionsRepo.findOneOrFailWithRelations(streamDto.toEntity().section.id);
    stream.assign(user, section);
    await this.usersRepo.save(user);

    return StreamDto.fromEntity(stream, ['read', StreamDto.READ]);
  }
}
