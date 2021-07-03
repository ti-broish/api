import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersRepository } from 'src/users/entities/users.repository';
import { Repository } from 'typeorm';
import { Checkin } from './checkin.entity';

@Injectable()
export class CheckinsRepository {
  constructor(
    @InjectRepository(Checkin) private checkinsRepo: Repository<Checkin>,
    private usersRepo: UsersRepository,
  ) {}

  async save(checkin: Checkin): Promise<Checkin> {
    const savedCheckin = await this.checkinsRepo.save(checkin);
    savedCheckin.actor.section = checkin.section;
    await this.usersRepo.save(savedCheckin.actor);

    return savedCheckin;
  }
}
