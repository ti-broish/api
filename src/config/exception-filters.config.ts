import { INestApplication } from '@nestjs/common';
import { NotFoundExceptionFilter } from 'src/exceptions/not-found-exception.filter';

export function addExceptionFilters(app: INestApplication) {
  app.useGlobalFilters(
    new NotFoundExceptionFilter(),
  );
}
