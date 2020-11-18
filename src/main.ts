import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiModule } from './api.module';

async function bootstrap() {
  const api = await NestFactory.create(ApiModule);

  const options = new DocumentBuilder()
    .setTitle('Ti Broish API')
    .setDescription('Ti Broish API is built for clients sending in election results data in Bulgaria')
    .setVersion('0.1')
    .setContact('Da Bulgaria', 'https://dabulgaria.bg', 'team@dabulgaria.bg')
    .build();

  const document = SwaggerModule.createDocument(api, options, {
    operationIdFactory: (
      controllerKey: string,
      methodKey: string
    ) => controllerKey.replace(/controller/ig, '') + '.' + methodKey,
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup('api', api, document);

  await api.listen(3000);
}
bootstrap();
