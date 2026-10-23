import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app'
import { setUpSwagger, enableCors, setBodySize } from './http'
import { enableGracefulShutfown, useContainerForValidator } from './config'
import { LogLevel } from '@nestjs/common'
import { ClusterService } from './http/cluster.service'
import { NotFoundExceptionFilter } from './http/not-found-exception.filter'

async function bootstrap() {
  const debugLogs: LogLevel[] =
    process.env.NODE_ENV === 'production' ? [] : ['log', 'debug', 'verbose']
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', ...debugLogs],
  })
  setUpSwagger(app)
  useContainerForValidator(app.select(AppModule))
  setBodySize(app)
  enableGracefulShutfown(app)
  enableCors(app)
  // Return 404 instead of 500 when an entity lookup (e.g. GET /violations/:id) misses.
  app.useGlobalFilters(new NotFoundExceptionFilter())
  await app.listen(app.get(ConfigService).get<number>('PORT', 4000))
}
ClusterService.clusterize(bootstrap)
