import { Controller, Get, Post, HttpCode, Param, Body, UsePipes, ValidationPipe, Inject, ForbiddenException } from '@nestjs/common';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { PictureDto } from '../../pictures/api/picture.dto';
import { PicturesUrlGenerator } from '../../pictures/pictures-url-generator.service';
import { User } from '../../users/entities';
import { ViolationsRepository } from '../entities/violations.repository';
import { ViolationDto } from './violation.dto';

@Controller('violations')
export class ViolationsController {
  constructor(
    @Inject(ViolationsRepository) private readonly repo: ViolationsRepository,
    @Inject(PicturesUrlGenerator) private readonly urlGenerator: PicturesUrlGenerator,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['create'] }, groups: ['create'] }))
  async create(
    @Body() violationDto: ViolationDto,
    @InjectUser() user: User,
  ): Promise<ViolationDto> {
    const violation = violationDto.toEntity();
    violation.setReceivedStatus(user);
    const savedDto = ViolationDto.fromEntity(await this.repo.save(violation));
    this.updatePicturesUrl(savedDto);

    return savedDto;
  }

  @Get(':id')
  @HttpCode(200)
  async get(
    @Param('id') id: string,
    @InjectUser() user: User,
  ): Promise<ViolationDto> {
    const violation = await this.repo.findOneOrFail(id);
    if (violation.getAuthor().id !== user.id) {
      throw new ForbiddenException();
    }
    const dto = ViolationDto.fromEntity(violation);
    this.updatePicturesUrl(dto);

    return dto;
  }

  private updatePicturesUrl(violationDto: ViolationDto) {
    violationDto.pictures.forEach((picture: PictureDto) => picture.url = this.urlGenerator.getUrl(picture));

    return violationDto;
  }
}
