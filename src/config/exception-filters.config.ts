import { INestApplication } from '@nestjs/common';
import { NotFoundExceptionFilter, ProtocolResultsConflictExceptionFilter } from 'src/filters';

export function addExceptionFilters(app: INestApplication) {
  app.useGlobalFilters(
    new NotFoundExceptionFilter(),
    new ProtocolResultsConflictExceptionFilter()
  );
}
