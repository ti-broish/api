import { Catch, ArgumentsHost, HttpStatus, HttpException, HttpServer, Injectable, Inject } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { ProtocolHasResultsException, ProtocolStatusException } from '../protocols/entities/protocol.exceptions';

interface ExceptionResponse {
  message: string|string[],
  error: string, // for backwards-compatibility with default validation response
  errorType: string,
  statusCode: number,
}

@Catch(ProtocolHasResultsException, ProtocolStatusException, HttpException)
@Injectable()
export class I18nExceptionsFilter extends BaseExceptionFilter {
  private readonly i18n: I18nService;

  constructor(@Inject(I18nService) i18n: I18nService, httpAdapter?: HttpAdapterHost) {
    super(httpAdapter.httpAdapter);
    this.i18n = i18n;
  }

  async catch(exception: Error, host: ArgumentsHost) {
    const context = host.switchToHttp();
    let statusCode = HttpStatus.CONFLICT;
    const errorType = exception.constructor.name;
    const response = {
      statusCode,
      errorType,
      message: exception.message,
      error: errorType
    } as ExceptionResponse;

    if (exception instanceof HttpException) {
      const httpResponse = exception.getResponse() as { message: string, statusCode: number, error: string };
      statusCode = httpResponse.statusCode;
      response.message = httpResponse.message;
      response.error = httpResponse.error;
    }
    response.message = await this.translate(context.getRequest().i18nLang, response.message);

    context.getResponse<Response>()
      .status(statusCode)
      .json(response);
  }

  private async translate(lang: string, message: string|string[]): Promise<string|string[]> {
    if (Array.isArray(message)) {
      return Promise.all(message.map((message: string): Promise<string> => {
        return this.translateMessage(lang, message);
      }));
    }

    return this.translateMessage(lang, message);
  }

  private translateMessage(lang: string, message: string): Promise<string> {
    return this.i18n.translate(`errors.${message}`, { lang });
  }
}
