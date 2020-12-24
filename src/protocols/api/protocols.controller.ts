import { Controller, Get, Post, HttpCode, Query, Param, Body, ValidationPipe, UsePipes, Inject, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectUser } from 'src/auth/decorators/injectUser.decorator';
import { PictureDto } from 'src/pictures/api/picture.dto';
import { PicturesUrlGenerator } from 'src/pictures/pictures-url-generator.service';
import { User } from 'src/users/entities';
import { ProtocolsRepository } from '../entities/protocols.repository';
import { ProtocolResultDto, ProtocolResultsDto } from './protocol-results.dto';
import { ProtocolDto } from './protocol.dto';

@Controller('protocols')
export class ProtocolsController {
  constructor(
    @Inject(ProtocolsRepository) private readonly repo: ProtocolsRepository,
    @Inject(PicturesUrlGenerator) private readonly urlGenerator: PicturesUrlGenerator,
  ) {}

  @Post()
  @HttpCode(201)
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

    const savedDto = ProtocolDto.fromEntity(await this.repo.save(protocol));
    this.updatePicturesUrl(savedDto);

    return resultsDto;
  }

  @Get(':id')
  @HttpCode(200)
  async get(
    @Param('id') id: string,
    @InjectUser() user: User,
  ): Promise<ProtocolDto> {
    const protocol = await this.repo.findOneOrFail(id);
    if (protocol.getAuthor().id !== user.id) {
      throw new ForbiddenException();
    }
    const dto = ProtocolDto.fromEntity(protocol);
    dto.pictures.forEach(picture => picture.url = this.urlGenerator.getUrl(picture));
    return dto;
  }

  @Get(':id/results')
  @HttpCode(200)
  async results(@Param('id') id: string): Promise<ProtocolResultsDto> {
    return ProtocolResultsDto.fromEntity(await this.repo.findOneOrFail(id));
  }

  private updatePicturesUrl(protocolDto: ProtocolDto) {
    protocolDto.pictures.forEach((picture: PictureDto) => picture.url = this.urlGenerator.getUrl(picture));

    return protocolDto;
  }
}
