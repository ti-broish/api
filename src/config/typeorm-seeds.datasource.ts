import { DataSource } from 'typeorm'
import { AppDataSource } from './typeorm.datasource'

export const SeedsDataSource = new DataSource({
  ...AppDataSource.options,
  migrationsTableName: 'seeds',
  migrations: ['dist/seeds/*.js'],
})
