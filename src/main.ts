import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setUpSwagger, NotFoundExceptionFilter } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setUpSwagger(app);
  app.useGlobalFilters(new NotFoundExceptionFilter());
  await app.listen(app.get(ConfigService).get<number>('PORT', 3000));
}
bootstrap();
