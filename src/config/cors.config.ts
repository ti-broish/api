import { INestApplication } from '@nestjs/common'

export function enableCors(app: INestApplication): void {
  app.enableCors({
    origin: true,
    allowedHeaders: 'Content-Type,Accept,Authorization',
    credentials: true,
    maxAge: 2 * 60 * 60,
  })
}
