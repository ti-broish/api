import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ProtocolHasResultsException } from 'src/protocols/entities/protocol-has-results.exception';

@Catch(ProtocolHasResultsException)
export class ProtocolResultsConflictExceptionFilter implements ExceptionFilter {
  catch(exception: ProtocolHasResultsException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    ctx.getResponse<Response>()
      .status(HttpStatus.CONFLICT)
      .json({
        message: exception.message,
        statusCode: HttpStatus.CONFLICT,
      });
  }
}
