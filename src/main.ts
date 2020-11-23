import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle('Ti Broish API')
    .setDescription('Ti Broish API is built for clients sending in election results data in Bulgaria')
    .setVersion('0.1')
    .setContact('Da Bulgaria', 'https://dabulgaria.bg', 'team@dabulgaria.bg')
    .build();

  const document = SwaggerModule.createDocument(app, options, {
    operationIdFactory: (
      controllerKey: string,
      methodKey: string
    ) => controllerKey.replace(/controller/ig, '') + '.' + methodKey,
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup('app', app, document);

  await app.listen(3000);
}
bootstrap();
