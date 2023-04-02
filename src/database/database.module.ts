import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { ConfigModule } from '../config'
import { TypeOrmConfigService } from './typeorm.config'
import { TypeORMExceptionFilter } from './query-exception.filter'
import { APP_FILTER } from '@nestjs/core'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService, DataSource],
      useClass: TypeOrmConfigService,
    }),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: TypeORMExceptionFilter,
    },
  ],
})
export class DatabaseModule {
  constructor(private readonly dataSource: DataSource) {}

  onModuleDestroy() {
    void this.dataSource.destroy()
  }
}
