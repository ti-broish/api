import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Picture } from './picture.entity';

@Injectable()
export class PicturesRepository {
  constructor(
    @InjectRepository(Picture)
    private repo: Repository<Picture>,
  ) {}

  findOne(id: string): Promise<Picture | undefined> {
    return this.repo.findOne({ where: { id } });
  }

  findOneOrFail(id: string): Promise<Picture> {
    return this.repo.findOneOrFail({ where: { id } });
  }

  async save(picture: Picture): Promise<Picture> {
    return await this.repo.save(picture);
  }
}
