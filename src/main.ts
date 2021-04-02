import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { setUpSwagger, jsonMiddleware } from './config';
import { TranslateStatusInterceptor } from './i18n/translate-status.interceptor';
import { I18nService } from 'nestjs-i18n';
import { ShutdownSignal } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  if (config.get<boolean>('API_DOCS', false)) {
    setUpSwagger(app);
  }
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useGlobalInterceptors(new TranslateStatusInterceptor(app.get(I18nService)));
  app.use(jsonMiddleware)
  if (config.get('NODE_ENV') === 'production') {
    app.enableShutdownHooks([ShutdownSignal.SIGINT, ShutdownSignal.SIGTERM]);
  }
  app.enableCors();
  await app.listen(config.get<number>('PORT', 3000));
}
bootstrap();
