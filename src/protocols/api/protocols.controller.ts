import { Recaptcha } from '@nestlab/google-recaptcha/decorators/recaptcha'
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
  Patch,
  ForbiddenException,
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
import { ProtocolContactDto, ProtocolDto } from './protocol.dto'
import { ProtocolFilters } from './protocols-filters.dto'
import { ViolationDto } from '../../violations/api/violation.dto'
import {
  AcceptedResponse,
  ACCEPTED_RESPONSE_STATUS,
} from 'src/http/accepted-response'
import { BadRequestException } from '@nestjs/common'
import { paginationRoute } from 'src/utils/pagination-route'
import { WorkItemNotFoundError, WorkQueue } from './work-queue.service'
import { AppAbility, CaslAbilityFactory } from 'src/casl/casl-ability.factory'
import { Public } from 'src/auth/decorators'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'

@Controller('protocols')
export class ProtocolsController {
  constructor(
    @Inject(ProtocolsRepository) private readonly repo: ProtocolsRepository,
    @Inject(PicturesUrlGenerator)
    private readonly urlGenerator: PicturesUrlGenerator,
    private readonly workQueue: WorkQueue,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Protocol))
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
  @Public()
  @UseGuards(PoliciesGuard, ThrottlerGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Protocol))
  @Throttle(4, 60)
  @Recaptcha()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['create'] },
      groups: ['create'],
    }),
  )
  async create(
    @Body() protocolDto: ProtocolDto,
    @InjectUser() user?: User,
  ): Promise<ProtocolDto> {
    const protocol = protocolDto.toEntity(['create'])
    protocol.receive(user)

    const savedProtocol = await this.repo.save(protocol)
    void this.workQueue.addProtocolForValidation(protocol)
    const savedDto = ProtocolDto.fromEntity(savedProtocol, [
      'read',
      'author_read',
      'created',
    ])
    this.updatePicturesUrl(savedDto)

    return savedDto
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Protocol))
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
  @CheckPolicies((ability: AppAbility) =>
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
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Protocol))
  async assign(
    @InjectUser() user: User,
    @Res() response: Response,
  ): Promise<ProtocolDto | string> {
    const workItem = await this.workQueue.assignNextAvailableWorkItem(user)
    if (workItem === null) {
      response.status(HttpStatus.NO_CONTENT)
      response.send('')
      return ''
    }

    const savedDto = ProtocolDto.fromEntity(workItem.protocol)
    this.updatePicturesUrl(savedDto)
    response.send(savedDto)
    return savedDto
  }

  @Get(':id')
  @Public()
  @HttpCode(200)
  async get(
    @Param('id') id: string,
    @InjectUser() user?: User,
    @Query('secret') secret?: string,
  ): Promise<ProtocolDto> {
    const ability = this.caslAbilityFactory.createForUser(user)
    const protocol = await this.repo.findOneOrFail(id)
    const canAccessProtocol = ability.can(Action.Read, protocol)
    const canAccessOwnProtocol = secret === protocol.secret
    if (!canAccessProtocol && !canAccessOwnProtocol) {
      throw new ForbiddenException()
    }

    const canManageProtocol = ability.can(Action.Manage, protocol)
    const dto = ProtocolDto.fromEntity(
      protocol,
      canManageProtocol || canAccessOwnProtocol
        ? ['read', 'protocol.validate', 'author_read', 'get', 'read.results']
        : ['read'],
    )
    this.updatePicturesUrl(dto)

    return dto
  }

  @Patch(':id/contact')
  @HttpCode(HttpStatus.ACCEPTED)
  @Public()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Protocol))
  @Throttle(4, 60)
  @Recaptcha()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { groups: ['setContact'] },
      groups: ['setContact'],
    }),
  )
  async setContact(
    @Param('id') id: string,
    @Body() contactDto: ProtocolContactDto,
  ): Promise<string> {
    const protocol = await this.repo.findOneOrFail(id)
    if (protocol.secret !== contactDto.secret) {
      throw new ForbiddenException()
    }
    protocol.setContact(contactDto.email)
    await this.repo.save(protocol)
    return ''
  }

  private updatePicturesUrl(protocolDto: ProtocolDto | ViolationDto) {
    protocolDto.pictures.forEach(
      (picture: PictureDto) =>
        (picture.url = this.urlGenerator.getUrl(picture)),
    )

    return protocolDto
  }
}
