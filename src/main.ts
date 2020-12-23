import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import * as bodyParser from 'body-parser';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import { setUpSwagger, NotFoundExceptionFilter } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setUpSwagger(app);
  app.useGlobalFilters(new NotFoundExceptionFilter());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.use(bodyParser.json({ limit: '50mb' }))
  await app.listen(app.get(ConfigService).get<number>('PORT', 3000));
}
bootstrap();
