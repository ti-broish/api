import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setUpSwagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('Ti Broish API')
    .setDescription('Ti Broish API is built for clients sending in election results data in Bulgaria')
    .setVersion('0.1')
    .setContact('Da Bulgaria', 'https://dabulgaria.bg', 'team@dabulgaria.bg')
    .addBearerAuth({
      type: 'http',
      description: 'Firebase Authentication on the client with JWT tokens sent to the API',
      name: 'Firebase',
    }, 'Firebase bearer token')
    .build();

  const document = SwaggerModule.createDocument(app, options, {
    operationIdFactory: (
      controllerKey: string,
      methodKey: string
    ) => controllerKey.replace(/controller/ig, '') + '.' + methodKey,
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup('docs', app, document);
}
