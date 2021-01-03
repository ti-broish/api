import { Body, Controller, Get, HttpCode, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectUser } from 'src/auth/decorators';
import { User } from 'src/users/entities';
import { BroadcastStatus } from '../../entities/broadcast.entity';
import { BroadcastsRepository } from '../../entities/broadcasts.repository';
import { BroadcastDto } from '../broadcast.dto';

@Controller('broadcasts')
export class BroadcastsController {
  constructor(private readonly repo: BroadcastsRepository) { }

  @Get()
  @HttpCode(200)
  async index(): Promise<BroadcastDto[]> {
    return (await this.repo.findAllToBePublishedAndPending()).map(BroadcastDto.fromEntity);
  }

  @Post()
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['broadcast.create'] }, groups: ['broadcast.create'] }))
  async create(
    @Body() broadcastDto: BroadcastDto,
    @InjectUser() user: User
  ): Promise<BroadcastDto> {
    const broadcast = broadcastDto.toEntity();
    broadcast.author = user;
    broadcast.status = BroadcastStatus.PENDING;

    return BroadcastDto.fromEntity(await this.repo.save(broadcast));
  }
}
