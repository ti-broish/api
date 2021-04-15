import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { setUpSwagger, setBodySize } from './config';
import { ShutdownSignal } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  if (config.get<boolean>('API_DOCS', false)) {
    setUpSwagger(app);
  }
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  setBodySize(app);
  if (config.get('NODE_ENV') === 'production') {
    app.enableShutdownHooks([ShutdownSignal.SIGINT, ShutdownSignal.SIGTERM]);
  }
  await app.listen(config.get<number>('PORT', 3000));
}
bootstrap();
