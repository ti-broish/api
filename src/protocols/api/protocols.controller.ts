import { Ability } from '@casl/ability';
import { Controller, Get, Post, HttpCode, Param, Body, ValidationPipe, UsePipes, Inject, ConflictException, UseGuards, Query, Put, ParseArrayPipe } from '@nestjs/common';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { UserDto } from 'src/users/api/user.dto';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { PictureDto } from '../../pictures/api/picture.dto';
import { PicturesUrlGenerator } from '../../pictures/pictures-url-generator.service';
import { User } from '../../users/entities';
import { ProtocolResult } from '../entities/protocol-result.entity';
import { Protocol } from '../entities/protocol.entity';
import { ProtocolsRepository } from '../entities/protocols.repository';
import { ProtocolResultsDto } from './protocol-results.dto';
import { ProtocolDto } from './protocol.dto';
import { ProtocolFilters } from './protocols-filters.dto';

@Controller('protocols')
export class ProtocolsController {
  constructor(
    @Inject(ProtocolsRepository) private readonly repo: ProtocolsRepository,
    @Inject(PicturesUrlGenerator) private readonly urlGenerator: PicturesUrlGenerator,
  ) {}


  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Protocol))
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(@Query() query: ProtocolFilters): Promise<Pagination<Protocol>> {
    const pagination = await paginate(this.repo.queryBuilderWithFilters(query), { page: query.page, limit: 2, route: '/protocols' });
    pagination.items.map(ProtocolDto.fromEntity);

    return pagination;
  }

  @Post()
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Create, Protocol))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['create'] }, groups: ['create'] }))
  async create(
    @Body() protocolDto: ProtocolDto,
    @InjectUser() user: User,
  ): Promise<ProtocolDto> {
    const protocol = protocolDto.toEntity();
    protocol.setReceivedStatus(user);

    const savedDto = ProtocolDto.fromEntity(await this.repo.save(protocol));
    this.updatePicturesUrl(savedDto);

    return savedDto;
  }

  @Post(':id/results')
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Create, ProtocolResult))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['create'] }, groups: ['create'] }))
  async createResults(
    @Param('id') protocolId: string,
    @Body() resultsDto: ProtocolResultsDto,
    @InjectUser() user: User,
  ): Promise<ProtocolResultsDto> {
    const protocol = await this.repo.findOneOrFail(protocolId);
    protocol.populate(user, resultsDto.toResults());

    const savedProtocol = await this.repo.save(protocol);

    return ProtocolResultsDto.fromEntity(savedProtocol);
  }

  @Get(':id/assignees')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  async getAssignees( @Param('id') protocolId: string ): Promise<UserDto[]> {
    const protocol = await this.repo.findOneOrFail(protocolId);

    return protocol.assignees.map(UserDto.fromEntity);
  }

  @Put(':id/assignees')
  @HttpCode(202)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['assignee'] }, groups: ['assignee'] }))
  async putAssignees(
    @Param('id') protocolId: string,
    @Body(new ParseArrayPipe({ items: UserDto, transformOptions: { groups: ['assignee'] }, groups: ['assignee'] })) assigneeDtos: UserDto[],
    @InjectUser() user: User,
  ): Promise<object> {
    const protocol = await this.repo.findOneOrFail(protocolId);
    protocol.assign(user, assigneeDtos.map((userDto: UserDto) => userDto.toEntity()));
    await this.repo.save(protocol);

    return {'status': 'Accepted'};
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Protocol))
  async get(@Param('id') id: string): Promise<ProtocolDto> {
    const protocol = await this.repo.findOneOrFail(id);
    const dto = ProtocolDto.fromEntity(protocol);
    this.updatePicturesUrl(dto);

    return dto;
  }

  @Get(':id/results')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, ProtocolResult))
  async results(@Param('id') id: string): Promise<ProtocolResultsDto> {
    return ProtocolResultsDto.fromEntity(await this.repo.findOneOrFail(id));
  }

  private updatePicturesUrl(protocolDto: ProtocolDto) {
    protocolDto.pictures.forEach((picture: PictureDto) => picture.url = this.urlGenerator.getUrl(picture));

    return protocolDto;
  }
}
