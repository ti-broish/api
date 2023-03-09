import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { NotFoundExceptionFilter } from './not-found-exception.filter'

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: NotFoundExceptionFilter,
    },
  ],
})
export class HttpModule {}
