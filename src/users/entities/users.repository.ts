import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, SelectQueryBuilder } from 'typeorm'
import { User } from './user.entity'
import { UsersFilters } from '../api/users-filters.dto'

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  getRepo(): Repository<User> {
    return this.repo
  }

  findOne(id: string): Promise<User | undefined> {
    return this.repo.findOne({ where: { id }, relations: ['organization'] })
  }

  findOneOrFail(id: string): Promise<User> {
    return this.repo.findOneOrFail({
      where: { id },
      relations: ['organization'],
    })
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User> {
    return await this.repo.findOne({
      where: { firebaseUid },
      relations: ['organization'],
    })
  }

  async findByEmail(email: string): Promise<User> {
    return await this.repo.findOneBy({ email })
  }

  async findAll(): Promise<User[]> {
    return this.repo.find()
  }

  queryBuilderWithFilters(filters: UsersFilters): SelectQueryBuilder<User> {
    const qb = this.repo.createQueryBuilder('people')

    qb.innerJoinAndSelect('people.organization', 'organization')
    const { firstName, lastName, email, organization, role } = filters

    if (firstName) {
      qb.andWhere('people.firstName LIKE :firstName', {
        firstName: `%${firstName}%`,
      })
    }

    if (lastName) {
      qb.andWhere('people.lastName LIKE :lastName', {
        lastName: `%${lastName}%`,
      })
    }

    if (email) {
      qb.andWhere('people.email LIKE :email', { email: `%${email}%` })
    }

    if (organization) {
      qb.andWhere('organization.id = :organization', { organization })
    }

    if (role) {
      qb.andWhere('people.roles::jsonb ? :role', { role })
    }

    return qb
  }

  async save(user: User): Promise<User> {
    return await this.repo.save(user)
  }

  async update(user: User): Promise<User> {
    await this.repo.update(user.id, user)

    return this.findOneOrFail(user.id)
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id)
  }
}
