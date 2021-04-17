import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import {
  setUpSwagger,
  enableCors,
  setBodySize,
  enableGracefulShutfown,
  useContainerForValidator,
} from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  if (config.get<boolean>('API_DOCS', false)) {
    setUpSwagger(app);
  }
  useContainerForValidator(app.select(AppModule));
  setBodySize(app);
  enableGracefulShutfown(app);
  enableCors(app);
  await app.listen(config.get<number>('PORT', 3000));
}
bootstrap();
