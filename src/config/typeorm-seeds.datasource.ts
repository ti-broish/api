import { DataSource } from 'typeorm'

export const SeedsDataSource = new DataSource({
  type: 'postgres',
  host: 'ti-broish-db',
  port: 5432,
  username: 'postgres',
  password: 'ti-broish',
  database: 'ti_broish',
  logging: true,
  synchronize: false,
  migrations: ['dist/seeds/*.js'],
})
