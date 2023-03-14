import {
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Injectable,
  Inject,
} from '@nestjs/common'
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core'
import { Response } from 'express'
import { I18nService } from 'nestjs-i18n'
import {
  ViolationPublishingException,
  ViolationStatusException,
} from 'src/violations/entities/violation.exceptions'
import {
  ProtocolHasResultsException,
  ProtocolStatusConflictException,
  ProtocolStatusException,
} from '../protocols/entities/protocol.exceptions'

interface ExceptionResponse {
  message: string | string[]
  error: string // for backwards-compatibility with default validation response
  errorType: string
  statusCode: number
}

@Catch(
  ProtocolHasResultsException,
  ProtocolStatusException,
  ProtocolStatusConflictException,
  ViolationStatusException,
  ViolationPublishingException,
  HttpException,
)
@Injectable()
export class I18nExceptionsFilter extends BaseExceptionFilter {
  private readonly i18n: I18nService

  constructor(
    @Inject(I18nService) i18n: I18nService,
    httpAdapter?: HttpAdapterHost,
  ) {
    super(httpAdapter.httpAdapter)
    this.i18n = i18n
  }

  async catch(exception: Error, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const errorType = exception.constructor.name
    const response = {
      statusCode: HttpStatus.CONFLICT,
      errorType,
      message: exception.message,
      error: errorType,
    } as ExceptionResponse

    if (exception instanceof HttpException) {
      const httpResponse = exception.getResponse() as Pick<
        ExceptionResponse,
        'message' | 'statusCode' | 'error'
      >
      Object.assign(response, httpResponse)
    }

    response.message = await this.translate(
      context.getRequest().i18nLang,
      response.message,
    )

    context.getResponse<Response>().status(response.statusCode).json(response)
  }

  private async translate(
    lang: string,
    message: string | string[],
  ): Promise<string | string[]> {
    if (Array.isArray(message)) {
      return Promise.all(
        message.map((message: string): Promise<string> => {
          return this.translateMessage(lang, message)
        }),
      )
    }

    return this.translateMessage(lang, message)
  }

  private translateMessage(lang: string, message: string): Promise<string> {
    return this.i18n.translate(`errors.${message}`, { lang })
  }
}
