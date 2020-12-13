import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setUpSwagger, NotFoundExceptionFilter } from './config';
import { useContainer } from 'class-validator';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  setUpSwagger(app);
  app.useGlobalFilters(new NotFoundExceptionFilter());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.use(bodyParser.json({ limit: '50mb' }))
  await app.listen(app.get(ConfigService).get<number>('PORT', 3000));
}
bootstrap();
