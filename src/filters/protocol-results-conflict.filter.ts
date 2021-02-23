import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ProtocolException, ProtocolHasResultsException, ProtocolStatusException } from '../protocols/entities/protocol.exceptions';

@Catch(ProtocolHasResultsException, ProtocolStatusException)
export class ProtocolConflictExceptionFilter implements ExceptionFilter {
  catch(exception: ProtocolException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    ctx.getResponse<Response>()
      .status(HttpStatus.CONFLICT)
      .json({
        message: exception.getMessage(),
        statusCode: HttpStatus.CONFLICT,
        errorType: exception.getType(),
      });
  }
}
