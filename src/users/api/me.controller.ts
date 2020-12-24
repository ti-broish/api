import { Controller, Get, HttpCode, Delete, Inject, Patch, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectUser } from 'src/auth/decorators/injectUser.decorator';
import { PicturesUrlGenerator } from 'src/pictures/pictures-url-generator.service';
import { ProtocolDto } from 'src/protocols/api/protocol.dto';
import { ProtocolsRepository } from 'src/protocols/entities/protocols.repository';
import { User } from '../entities/user.entity';
import { UsersRepository } from '../entities/users.repository';
import { UserDto } from './user.dto';

@Controller('me')
export class MeController {
  constructor(
    @Inject(UsersRepository) private readonly usersRepo: UsersRepository,
    @Inject(ProtocolsRepository) private readonly protocolsRepo: ProtocolsRepository,
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
    protocols.forEach(protocol => protocol.pictures.forEach(picture => picture.url = this.picturesUrlGenerator.getUrl(picture)));

    return protocols;
  }

  @Delete()
  @HttpCode(202)
  async delete(@InjectUser() user: User): Promise<void> {
    // TODO: delete only if no protocols are submitted by this user
    await this.usersRepo.delete(user.id);
  }
}
