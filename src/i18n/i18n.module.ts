import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import {
  AcceptLanguageResolver,
  I18nJsonLoader,
  I18nModule as NestI18nModule,
} from 'nestjs-i18n'
import { I18nExceptionsFilter } from './i18n-exceptions.filter'
import { TranslateStatusInterceptor } from './translate-status.interceptor'

@Module({
  imports: [
    ConfigModule,
    NestI18nModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        fallbackLanguage: config.get<string>('NEST_LANG', 'bg'),
        loaderOptions: {
          path: __dirname,
        },
      }),
      resolvers: [AcceptLanguageResolver],
      loader: I18nJsonLoader,
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TranslateStatusInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: I18nExceptionsFilter,
    },
  ],
})
export class I18nModule {}
