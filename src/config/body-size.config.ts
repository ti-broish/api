import { INestApplication } from '@nestjs/common';
import { jsonMiddleware } from '.';

export function setBodySize(app: INestApplication): void {
  app.use(jsonMiddleware)
}
