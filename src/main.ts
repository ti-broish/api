import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app'
import { setUpSwagger, enableCors, setBodySize } from './http'
import { enableGracefulShutfown, useContainerForValidator } from './config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })
  setUpSwagger(app)
  useContainerForValidator(app.select(AppModule))
  setBodySize(app)
  enableGracefulShutfown(app)
  enableCors(app)
  await app.listen(app.get(ConfigService).get<number>('PORT', 4000))
}
void bootstrap()
