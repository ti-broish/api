import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setUpSwagger, NotFoundExceptionFilter } from './config';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  setUpSwagger(app);
  app.useGlobalFilters(new NotFoundExceptionFilter());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  await app.listen(app.get(ConfigService).get<number>('PORT', 3000));
}
bootstrap();
