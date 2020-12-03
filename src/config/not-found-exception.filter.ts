import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError'

@Catch(EntityNotFoundError)
export class NotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: EntityNotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    ctx.getResponse<Response>()
      .status(HttpStatus.NOT_FOUND)
      .json({
        message: 'Resource not found.',
        statusCode: HttpStatus.NOT_FOUND,
      });
  }
}
