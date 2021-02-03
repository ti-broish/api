import { Ability } from '@casl/ability';
import { Controller, Get, Post, HttpCode, Param, Body, ValidationPipe, UsePipes, Inject, ConflictException, ForbiddenException, UseGuards, Query } from '@nestjs/common';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { PageDTO } from 'src/utils/page.dto';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { PictureDto } from '../../pictures/api/picture.dto';
import { PicturesUrlGenerator } from '../../pictures/pictures-url-generator.service';
import { User } from '../../users/entities';
import { ProtocolResult } from '../entities/protocol-result.entity';
import { Protocol } from '../entities/protocol.entity';
import { ProtocolsRepository } from '../entities/protocols.repository';
import { ProtocolResultsDto } from './protocol-results.dto';
import { ProtocolDto } from './protocol.dto';

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
  async index(@Query() query: PageDTO): Promise<Pagination<Protocol>> {
    const pagination = await paginate(this.repo.getRepo(), { page: query.page, limit: 100, route: '/protocols' });
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

  @Post(':protocol_id/results')
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Create, ProtocolResult))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['create'] } }))
  async createResults(
    @Param('protocol_id') protocolId: string,
    @Body() resultsDto: ProtocolResultsDto,
    @InjectUser() user: User,
  ): Promise<ProtocolResultsDto> {
    const protocol = await this.repo.findOneOrFail(protocolId);
    if (protocol.results.length > 0) {
      throw new ConflictException([
        'Cannot populate a populated protocol! You must create a new one.',
      ]);
    }
    protocol.populate(user, resultsDto.toResults(), resultsDto.toVotersData());

    const savedProtocol = await this.repo.save(protocol);
    const savedDto = ProtocolDto.fromEntity(savedProtocol);
    this.updatePicturesUrl(savedDto);

    return ProtocolResultsDto.fromEntity(savedProtocol);
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Protocol))
  async get(
    @Param('id') id: string,
    @InjectUser() user: User,
  ): Promise<ProtocolDto> {
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
