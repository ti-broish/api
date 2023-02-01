import { Ability } from '@casl/ability'
import {
  Controller,
  Get,
  Post,
  HttpCode,
  Param,
  Body,
  ValidationPipe,
  UsePipes,
  Inject,
  UseGuards,
  Query,
  Res,
  HttpStatus,
  Request,
} from '@nestjs/common'
import { Request as ExpressRequest, Response } from 'express'
import { paginate, Pagination } from 'nestjs-typeorm-paginate'
import { Action } from 'src/casl/action.enum'
import { CheckPolicies } from 'src/casl/check-policies.decorator'
import { PoliciesGuard } from 'src/casl/policies.guard'
import { SelectQueryBuilder } from 'typeorm'
import { InjectUser } from '../../auth/decorators/inject-user.decorator'
import { PictureDto } from '../../pictures/api/picture.dto'
import { PicturesUrlGenerator } from '../../pictures/pictures-url-generator.service'
import { User } from '../../users/entities'
import { ProtocolResult } from '../entities/protocol-result.entity'
import { Protocol, ProtocolRejectionReason } from '../entities/protocol.entity'
import {
  InvalidFiltersError,
  ProtocolsRepository,
} from '../entities/protocols.repository'
import { ProtocolDto } from './protocol.dto'
import { ProtocolFilters } from './protocols-filters.dto'
import { ViolationDto } from '../../violations/api/violation.dto'
import {
  AcceptedResponse,
  ACCEPTED_RESPONSE_STATUS,
} from '../../utils/accepted-response'
import { BadRequestException } from '@nestjs/common'
import { paginationRoute } from 'src/utils/pagination-route'
import { WorkItemNotFoundError, WorkQueue } from './work-queue.service'

@Controller('protocols')
export class ProtocolsController {
  constructor(
    @Inject(ProtocolsRepository) private readonly repo: ProtocolsRepository,
    @Inject(PicturesUrlGenerator)
    private readonly urlGenerator: PicturesUrlGenerator,
    private readonly workQueue: WorkQueue,
  ) {}

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Protocol))
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(
    @Query() query: ProtocolFilters,
    @Request() req: ExpressRequest,
  ): Promise<Pagination<ProtocolDto>> {
    let protocolsQb: SelectQueryBuilder<Protocol>
    try {
      protocolsQb = this.repo.queryBuilderWithFilters(query)
    } catch (err) {
      if (err instanceof InvalidFiltersError) {
        throw new BadRequestException(err.message)
      }
      throw err
    }
    const pagination = await paginate(protocolsQb, {
      page: query.page,
      limit: 100,
      route: paginationRoute(req),
    })

    return new Pagination<ProtocolDto>(
      await Promise.all(
        pagination.items.map(async (protocol: Protocol) =>
          ProtocolDto.fromEntity(protocol, [
            'read',
            'author_read',
            'protocol.validate',
          ]),
        ),
      ),
      pagination.meta,
      pagination.links,
    )
  }

  @Post()
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Create, Protocol))
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['create'] },
      groups: ['create'],
    }),
  )
  async create(
    @Body() protocolDto: ProtocolDto,
    @InjectUser() user: User,
  ): Promise<ProtocolDto> {
    const protocol = protocolDto.toEntity()
    protocol.receive(user)

    const savedProtocol = await this.repo.save(protocol)
    this.workQueue.addProtocolForValidation(protocol)
    const savedDto = ProtocolDto.fromEntity(savedProtocol, [
      'read',
      'author_read',
    ])
    this.updatePicturesUrl(savedDto)

    return savedDto
  }

  @Post(':id/reject')
  @HttpCode(202)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: ProtocolRejectionReason,
    @InjectUser() user: User,
  ): Promise<AcceptedResponse> {
    if (
      !reason ||
      Object.values(ProtocolRejectionReason).includes(reason) === false
    ) {
      throw new BadRequestException(
        'You must select a valid reason for the rejection',
      )
    }

    const protocol = await this.repo.findOneOrFail(id)
    let rejectedProtocolVersion: Protocol
    try {
      const workItem = await this.workQueue.completeItem(
        user,
        protocol,
        async () => {
          rejectedProtocolVersion = protocol.reject(user, reason)
          await this.repo.save(protocol)
          await this.repo.save(rejectedProtocolVersion)
        },
      )
      this.workQueue.checkResolution(user, workItem, rejectedProtocolVersion)
    } catch (err) {
      if (err instanceof WorkItemNotFoundError) {
        throw new BadRequestException('Work item not found')
      }
      throw err
    }

    return { status: ACCEPTED_RESPONSE_STATUS }
  }

  @Post(':id/replace')
  @HttpCode(201)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) =>
    ability.can(Action.Create, ProtocolResult),
  )
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['replace'] },
    }),
  )
  async replace(
    @Param('id') protocolId: string,
    @Body() replacementDto: ProtocolDto,
    @InjectUser() user: User,
  ): Promise<ProtocolDto> {
    const replacement = replacementDto.toEntity(['replace'])
    const prevProtocol = await this.repo.findOneOrFail(protocolId)
    let savedProtocol: Protocol
    let nextProtocol: Protocol

    const workItem = await this.workQueue.completeItem(
      user,
      prevProtocol,
      async () => {
        nextProtocol = prevProtocol.replace(user, replacement)
        await this.repo.save(prevProtocol)
        savedProtocol = await this.repo.save(nextProtocol)
      },
    )

    this.workQueue.checkResolution(user, workItem, savedProtocol)
    const savedDto = ProtocolDto.fromEntity(savedProtocol, [
      'read',
      'read.results',
    ])
    this.updatePicturesUrl(savedDto)

    return savedDto
  }

  @Post('assign')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  async assign(
    @InjectUser() user: User,
    @Res() response: Response,
  ): Promise<ProtocolDto | null> {
    const workItem = await this.workQueue.retrieveItemForValidation(user)

    if (workItem === null) {
      response.status(HttpStatus.NO_CONTENT)
      response.send('')
      return null
    }

    const { protocol } = await this.workQueue.assign(workItem, user)
    const savedDto = ProtocolDto.fromEntity(protocol)
    this.updatePicturesUrl(savedDto)
    response.send(savedDto)

    return savedDto
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Read, Protocol))
  async get(@Param('id') id: string): Promise<ProtocolDto> {
    const protocol = await this.repo.findOneOrFail(id)
    const dto = ProtocolDto.fromEntity(protocol, [
      'read',
      'protocol.validate',
      'author_read',
      'get',
      'read.results',
    ])
    this.updatePicturesUrl(dto)

    return dto
  }

  private updatePicturesUrl(protocolDto: ProtocolDto | ViolationDto) {
    protocolDto.pictures.forEach(
      (picture: PictureDto) =>
        (picture.url = this.urlGenerator.getUrl(picture)),
    )

    return protocolDto
  }
}
