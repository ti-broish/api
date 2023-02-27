import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'

dotenv.config()

const {
  DATABASE_HOST,
  DATABASE_NAME,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  DATABASE_PORT,
  DATABASE_SSL,
} = process.env

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DATABASE_HOST,
  port: parseInt(DATABASE_PORT, 10),
  username: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  logging: true,
  synchronize: false,
  ssl: DATABASE_SSL !== 'false',
  migrationsTableName: 'migrations',
  migrations: ['dist/migrations/*.js'],
})
