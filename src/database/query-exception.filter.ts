import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common'
import { Response } from 'express'
import { QueryFailedError, TypeORMError } from 'typeorm'

@Catch(TypeORMError)
export class TypeORMExceptionFilter implements ExceptionFilter {
  catch(exception: TypeORMError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status = 500
    console.error(
      `${exception.name}:`,
      exception instanceof QueryFailedError
        ? exception.query
        : exception.message,
    )

    response.status(status).json({
      statusCode: status,
      message: 'Internal server error',
    })
  }
}
