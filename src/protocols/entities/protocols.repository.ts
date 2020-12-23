import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Protocol } from './protocol.entity';

@Injectable()
export class ProtocolsRepository {
  constructor(@InjectRepository(Protocol) private readonly repo: Repository<Protocol>) {}

  findOneOrFail(id: string): Promise<Protocol> {
    return this.repo.findOneOrFail({ where: { id }, relations: ['section', 'pictures', 'data', 'results', 'actions'] } );
  }

  async save(protocol: Protocol): Promise<Protocol> {
    await this.repo.save(protocol);

    return this.findOneOrFail(protocol.id);
  }
}
