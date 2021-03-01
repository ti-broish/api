import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { ProtocolException, ProtocolHasResultsException, ProtocolStatusException } from '../entities/protocol.exceptions';

@Catch(ProtocolHasResultsException, ProtocolStatusException)
export class ProtocolConflictExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  async catch(exception: ProtocolException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const statusCode = HttpStatus.CONFLICT;
    const errorType = exception.getType();
    const lang = ctx.getRequest().i18nLang;
    const message = await this.i18n.translate(exception.getMessage(), { lang });
    ctx.getResponse<Response>()
      .status(statusCode)
      .json({ message, statusCode, errorType });
  }
}
