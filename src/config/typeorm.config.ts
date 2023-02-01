import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async createTypeOrmOptions(): Promise<TypeOrmModuleOptions> {
    return {
      type: 'postgres',
      host: this.config.get('DATABASE_HOST'),
      port: +this.config.get<number>('DATABASE_PORT'),
      username: this.config.get('DATABASE_USERNAME'),
      password: this.config.get('DATABASE_PASSWORD'),
      database: this.config.get('DATABASE_NAME'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false,
      migrationsTableName: 'migrations',
      migrations: ['dist/migrations/*.js'],
      extra: {
        max: this.config.get<number>('DATABASE_MAX_CONNECTIONS', 14),
      },
      cli: {
        migrationsDir: 'src/migrations',
      },
      ssl: this.config.get('DATABASE_SSL'),
      namingStrategy: new SnakeNamingStrategy(),
    } as TypeOrmModuleOptions
  }
}
