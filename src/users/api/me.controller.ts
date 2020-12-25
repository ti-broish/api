import { Controller, Get, HttpCode, Delete, Inject, Patch, Body, UsePipes, ValidationPipe, ConflictException } from '@nestjs/common';
import { InjectUser } from 'src/auth/decorators/injectUser.decorator';
import { PicturesUrlGenerator } from 'src/pictures/pictures-url-generator.service';
import { ProtocolDto } from 'src/protocols/api/protocol.dto';
import { ProtocolsRepository } from 'src/protocols/entities/protocols.repository';
import { ReportDto } from 'src/reports/api/report.dto';
import { ReportssRepository } from 'src/reports/entities/reports.repository';
import { User } from '../entities/user.entity';
import { UsersRepository } from '../entities/users.repository';
import { UserDto } from './user.dto';

@Controller('me')
export class MeController {
  constructor(
    @Inject(UsersRepository) private readonly usersRepo: UsersRepository,
    @Inject(ProtocolsRepository) private readonly protocolsRepo: ProtocolsRepository,
    @Inject(ReportssRepository) private readonly reportsRepo: ReportssRepository,
    @Inject(PicturesUrlGenerator) private readonly picturesUrlGenerator: PicturesUrlGenerator,
  ) { }

  @Get()
  @HttpCode(200)
  async get(@InjectUser() user: User): Promise<UserDto> {
    return UserDto.fromEntity(user);
  }

  @Patch()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: [UserDto.UPDATE] }, groups: [UserDto.UPDATE], skipMissingProperties: true }))
  async patch(@InjectUser() user: User, @Body() userDto: UserDto): Promise<UserDto> {
    const updatedUser = await this.usersRepo.update(userDto.updateEntity(user));

    return UserDto.fromEntity(updatedUser);
  }

  @Get('protocols')
  @HttpCode(200)
  async protocols(@InjectUser() user: User): Promise<ProtocolDto[]> {
    const protocols = (await this.protocolsRepo.findByAuthor(user)).map(ProtocolDto.fromEntity);
    this.updatePicturesUrl(protocols);

    return protocols;
  }


  @Get('reports')
  @HttpCode(200)
  async reports(@InjectUser() user: User): Promise<ReportDto[]> {
    const reports = (await this.reportsRepo.findByAuthor(user)).map(ReportDto.fromEntity);
    this.updatePicturesUrl(reports);

    return reports;
  }

  @Delete()
  @HttpCode(202)
  async delete(@InjectUser() user: User): Promise<void> {
    const submittedProtocols = await this.protocolsRepo.findByAuthor(user);
    if (submittedProtocols.length > 0) {
      throw new ConflictException([
        'Cannot delete a person record with submitted protocols! User records would be deleted 30 days after the election.'
      ]);
    }
    await this.usersRepo.delete(user.id);
  }

  private updatePicturesUrl(dtos: ReportDto[]|ProtocolDto[]): void {
    dtos.forEach((dto: ProtocolDto|ReportDto) => dto.pictures.forEach(picture => picture.url = this.picturesUrlGenerator.getUrl(picture)));
  }
}
