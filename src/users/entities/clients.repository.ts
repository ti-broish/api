import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '.';
import { Client } from './client.entity';

@Injectable()
export class ClientsRepository {
  constructor(
    @InjectRepository(Client)
    private repo: Repository<Client>,
  ) {}

  findOne(id: string): Promise<Client | undefined> {
    return this.repo.findOne({ where: { id }, relations: ['owner'] });
  }

  findOneOrFail(id: string): Promise<Client> {
    return this.repo.findOneOrFail({ where: { id }, relations: ['owner'] });
  }

  findAllForOwners(owners: User[]): Promise<Client[]> {
    return this.repo.find({
      join: {
        alias: 'client',
      },
      where: {
        owner: {
          id: In(owners.map((owner) => owner.id)),
        },
      },
    });
  }

  async save(client: Client): Promise<Client> {
    return await this.repo.save(client);
  }

  async update(client: Client): Promise<Client> {
    await this.repo.update(client.id, client);

    return this.findOneOrFail(client.id);
  }
}
