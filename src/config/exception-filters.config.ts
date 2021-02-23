import { INestApplication } from '@nestjs/common';
import { NotFoundExceptionFilter, ProtocolConflictExceptionFilter } from 'src/filters';

export function addExceptionFilters(app: INestApplication) {
  app.useGlobalFilters(
    new NotFoundExceptionFilter(),
    new ProtocolConflictExceptionFilter()
  );
}
