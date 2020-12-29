import { Controller, Get, HttpCode, Delete, Inject, Patch, Body, UsePipes, ValidationPipe, ConflictException } from '@nestjs/common';
import { InjectUser } from '../../auth/decorators/inject-user.decorator';
import { PicturesUrlGenerator } from 'src/pictures/pictures-url-generator.service';
import { ProtocolDto } from 'src/protocols/api/protocol.dto';
import { ProtocolsRepository } from 'src/protocols/entities/protocols.repository';
import { ViolationDto } from 'src/violations/api/violation.dto';
import { ViolationsRepository } from 'src/violations/entities/violations.repository';
import { User } from '../entities/user.entity';
import { UsersRepository } from '../entities/users.repository';
import { UserDto } from './user.dto';

@Controller('me')
export class MeController {
  constructor(
    @Inject(UsersRepository) private readonly usersRepo: UsersRepository,
    @Inject(ProtocolsRepository) private readonly protocolsRepo: ProtocolsRepository,
    @Inject(ViolationsRepository) private readonly violationsRepo: ViolationsRepository,
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


  @Get('violations')
  @HttpCode(200)
  async violations(@InjectUser() user: User): Promise<ViolationDto[]> {
    const violations = (await this.violationsRepo.findByAuthor(user)).map(ViolationDto.fromEntity);
    this.updatePicturesUrl(violations);

    return violations;
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

  private updatePicturesUrl(dtos: ViolationDto[]|ProtocolDto[]): void {
    dtos.forEach((dto: ProtocolDto|ViolationDto) => dto.pictures.forEach(picture => picture.url = this.picturesUrlGenerator.getUrl(picture)));
  }
}
