import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  getRepo(): Repository<User> {
    return this.repo;
  }

  findOne(id: string): Promise<User | undefined> {
    return this.repo.findOne({ where: { id }, relations: ['organization'] });
  }

  findOneOrFail(id: string): Promise<User> {
    return this.repo.findOneOrFail({
      where: { id },
      relations: ['organization'],
    });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User> {
    return await this.repo.findOne({
      where: { firebaseUid },
      relations: ['organization'],
    });
  }

  async findByEmail(email: string): Promise<User> {
    return await this.repo.findOne({ email });
  }

  async findAll(): Promise<User[]> {
    return this.repo.find();
  }

  async save(user: User): Promise<User> {
    return await this.repo.save(user);
  }

  async update(user: User): Promise<User> {
    await this.repo.update(user.id, user);

    return this.findOneOrFail(user.id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
