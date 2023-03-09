import { INestApplication } from '@nestjs/common'
import { jsonMiddleware } from './json.middleware'

export function setBodySize(app: INestApplication): void {
  app.use(jsonMiddleware)
}
