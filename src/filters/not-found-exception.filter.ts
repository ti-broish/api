import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError'

@Catch(EntityNotFoundError)
export class NotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: EntityNotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()

    console.warn(exception)

    ctx.getResponse<Response>().status(HttpStatus.NOT_FOUND).json({
      message: 'Resource not found.',
      statusCode: HttpStatus.NOT_FOUND,
    })
  }
}
