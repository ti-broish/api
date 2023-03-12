import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { ConfigModule } from '../config'
import { TypeOrmConfigService } from './typeorm.config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService, DataSource],
      useClass: TypeOrmConfigService,
    }),
  ],
})
export class DatabaseModule {
  constructor(private readonly dataSource: DataSource) {}

  onModuleDestroy() {
    void this.dataSource.destroy()
  }
}
