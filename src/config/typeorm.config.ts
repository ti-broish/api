import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import { AppDataSource } from './typeorm.datasource'

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      ...AppDataSource.options,
      autoLoadEntities: true,
      synchronize: false,
      extra: {
        max: this.config.get<number>('DATABASE_MAX_CONNECTIONS', 14),
      },
      namingStrategy: new SnakeNamingStrategy(),
    }
  }
}
