import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { setUpSwagger, jsonMiddleware } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setUpSwagger(app);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.use(jsonMiddleware)
  await app.listen(app.get(ConfigService).get<number>('PORT', 3000));
}
bootstrap();
