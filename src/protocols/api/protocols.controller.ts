import { Ability } from '@casl/ability';
import { Controller, Get, Post, HttpCode, Param, Body, ValidationPipe, UsePipes, Inject, UseGuards, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { UserDto } from 'src/users/api/user.dto';
import { EntityNotFoundError } from 'typeorm';
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
import { ViolationDto } from "../../violations/api/violation.dto";
import { ViolationsRepository } from "../../violations/entities/violations.repository";
import { TownDto } from "../../sections/api/town.dto";

@Controller('protocols')
export class ProtocolsController {
  constructor(
    @Inject(ProtocolsRepository) private readonly repo: ProtocolsRepository,
    @Inject(PicturesUrlGenerator) private readonly urlGenerator: PicturesUrlGenerator,
    @Inject(ViolationsRepository) private readonly violationsRepo: ViolationsRepository,
  ) {}


  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Protocol))
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(@Query() query: ProtocolFilters): Promise<Pagination<ProtocolDto>> {
    const pagination = await paginate(this.repo.queryBuilderWithFilters(query), { page: query.page, limit: 20, route: '/protocols' });

    return new Pagination<ProtocolDto>(
      await Promise.all(pagination.items.map(async (protocol: Protocol) =>
        ProtocolDto.fromEntity(protocol, [UserDto.AUTHOR_READ, 'protocol.validate'])
      )),
      pagination.meta,
      pagination.links,
    );
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

    const savedDto = ProtocolDto.fromEntity(await this.repo.save(protocol), [UserDto.AUTHOR_READ]);
    this.updatePicturesUrl(savedDto);

    return savedDto;
  }

  @Post(':id/approve-with-violation')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  async approveNotify(
    @Param('id') id: string,
    @Body('description') description: string,
    @Body('town') town: TownDto,
    @InjectUser() user: User,
  ): Promise<object> {
    const protocol = await this.repo.findOneOrFail(id);

    // approve and save protocol
    protocol.approve(user);
    await this.repo.save(protocol);

    // build violation from protocol
    const violationDto = ViolationDto.fromProtocol(protocol);
    violationDto.description = description;
    violationDto.town = protocol.section.town;
    violationDto.town = town;
    const violation = violationDto.toEntity();
    violation.setReceivedStatus(user);

    // save violation
    const savedEntity = await this.violationsRepo.save(violation);
    const savedDto = ViolationDto.fromEntity(savedEntity, ['violation.process', UserDto.AUTHOR_READ]);
    this.updatePicturesUrl(savedDto);

    return {'status': 'Accepted and Violation Sent'};
  }

  @Post(':id/reject')
  @HttpCode(202)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  async reject(@Param('id') id: string, @InjectUser() user: User): Promise<object> {
    const protocol = await this.repo.findOneOrFail(id);
    protocol.reject(user);

    await this.repo.save(protocol);

    return {'status': 'Accepted'};
  }

  @Post(':id/approve')
  @HttpCode(202)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  async approve(@Param('id') id: string, @InjectUser() user: User): Promise<object> {
    const protocol = await this.repo.findOneOrFail(id);
    protocol.approve(user);

    await this.repo.save(protocol);

    return {'status': 'Accepted'};
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

  @Post(':id/replace')
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Create, ProtocolResult))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['replace'] } }))
  async replace(
    @Param('id') protocolId: string,
    @Body() replacementDto: ProtocolDto,
    @InjectUser() user: User,
  ): Promise<ProtocolDto> {
    const replacement = replacementDto.toEntity(['replace']);
    const prevProtocol = await this.repo.findOneOrFail(protocolId);
    const nextProtocol = prevProtocol.replace(user, replacement);
    const savedProtocol = await this.repo.save(nextProtocol);
    const savedDto = ProtocolDto.fromEntity(savedProtocol, ['read.results']);
    savedDto.results = ProtocolResultsDto.fromEntity(savedProtocol);
    this.updatePicturesUrl(savedDto);

    return savedDto;
  }

  @Post('assign')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  async assign(@InjectUser() user: User, @Res() response: Response): Promise<ProtocolDto | null> {
    let protocol: Protocol;
    try {
      protocol = await this.repo.findAssignedPendingProtocol(user);
    } catch(error: any) {
      if (!(error instanceof EntityNotFoundError)) {
        throw error;
      }

      try {
        protocol = await this.repo.findNextAvailableProtocol(user);
        protocol.assign(user, [user]);
        protocol = await this.repo.save(protocol);
      } catch(error) {
        if (!(error instanceof EntityNotFoundError)) {
          throw error;
        }

        response.status(HttpStatus.NO_CONTENT);
        response.send('');
        return null;
      }
    }

    const savedDto = ProtocolDto.fromEntity(protocol);
    this.updatePicturesUrl(savedDto);
    response.send(savedDto);

    return savedDto;
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Protocol))
  async get(@Param('id') id: string): Promise<ProtocolDto> {
    const protocol = await this.repo.findOneOrFail(id);
    const dto = ProtocolDto.fromEntity(protocol, ['protocol.validate', UserDto.AUTHOR_READ, 'get']);
    dto.results = ProtocolResultsDto.fromEntity(protocol);
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

  private updatePicturesUrl(protocolDto: ProtocolDto|ViolationDto) {
    protocolDto.pictures.forEach((picture: PictureDto) => picture.url = this.urlGenerator.getUrl(picture));

    return protocolDto;
  }
}
