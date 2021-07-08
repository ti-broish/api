import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setUpSwagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('Ti Broish API')
    .setDescription(
      'Ti Broish API is built for clients sending in election results data in Bulgaria',
    )
    .addTag(
      'default',
      'Supported API endpoints. See below for deprecated endpoints.',
    )
    .addTag(
      'Deprecated',
      'These endpoints are deprecated and SHOULD NOT be used for new development. They may be subject to removal.',
    )
    .setVersion('0.1')
    .setContact('Ti Broish', 'https://tibroish.bg', 'team@tibroish.bg')
    .addBearerAuth(
      {
        type: 'http',
        description:
          'Firebase Authentication on the client with JWT tokens sent to the API',
        name: 'Firebase',
      },
      'Firebase bearer token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, options, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      controllerKey.replace(/controller/gi, '') + '.' + methodKey,
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup('docs', app, document);
}
