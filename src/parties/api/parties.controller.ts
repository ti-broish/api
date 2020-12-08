import { Controller, Get, HttpCode, Inject, Param } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { PartiesRepository } from '../entities/parties.repository';
import { PartyDto } from './Party.dto';

@Controller('parties')
export class PartiesController {
  constructor(private readonly repo: PartiesRepository) { }

  @Get()
  @HttpCode(200)
  async index(): Promise<PartyDto[]> {
    return (await this.repo.findAll()).map(PartyDto.fromEntity);
  }
}
