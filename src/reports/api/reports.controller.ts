import { Controller, Get, Post, HttpCode, Param, Body, UsePipes, ValidationPipe, Inject, ForbiddenException } from '@nestjs/common';
import { InjectUser } from 'src/auth/decorators/injectUser.decorator';
import { PictureDto } from 'src/pictures/api/picture.dto';
import { PicturesUrlGenerator } from 'src/pictures/pictures-url-generator.service';
import { User } from 'src/users/entities';
import { ReportssRepository } from '../entities/reports.repository';
import { ReportDto } from './report.dto';

@Controller('reports')
export class ReportsController {
  constructor(
    @Inject(ReportssRepository) private readonly repo: ReportssRepository,
    @Inject(PicturesUrlGenerator) private readonly urlGenerator: PicturesUrlGenerator,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: ['create'] }, groups: ['create'] }))
  async create(
    @Body() reportDto: ReportDto,
    @InjectUser() user: User,
  ): Promise<ReportDto> {
    const report = reportDto.toEntity();
    report.setReceivedStatus(user);
    const savedDto = ReportDto.fromEntity(await this.repo.save(report));
    this.updatePicturesUrl(savedDto);

    return savedDto;
  }

  @Get(':id')
  @HttpCode(200)
  async get(
    @Param('id') id: string,
    @InjectUser() user: User,
  ): Promise<ReportDto> {
    const report = await this.repo.findOneOrFail(id);
    if (report.getAuthor().id !== user.id) {
      throw new ForbiddenException();
    }
    const dto = ReportDto.fromEntity(report);
    this.updatePicturesUrl(dto);

    return dto;
  }

  private updatePicturesUrl(reportDto: ReportDto) {
    reportDto.pictures.forEach((picture: PictureDto) => picture.url = this.urlGenerator.getUrl(picture));

    return reportDto;
  }
}
