import { ExceptionFilter as BaseExceptionFilter, Catch, ArgumentsHost, HttpStatus, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { ProtocolHasResultsException, ProtocolStatusException } from '../protocols/entities/protocol.exceptions';

@Catch(ProtocolHasResultsException, ProtocolStatusException, HttpException)
export class I18nExceptionsFilter implements BaseExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  async catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const statusCode = HttpStatus.CONFLICT;
    const errorType = exception.name;
    const lang = ctx.getRequest().i18nLang;
    const message = await this.i18n.translate(exception.message, { lang });
    ctx.getResponse<Response>()
      .status(statusCode)
      .json({ message, statusCode, errorType });
  }
}
