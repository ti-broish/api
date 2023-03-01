import { ConfigModule, ConfigService } from '@nestjs/config'
import {
  AcceptLanguageResolver,
  I18nJsonLoader,
  I18nModule as NestI18nModule,
} from 'nestjs-i18n'

export const I18nModule = NestI18nModule.forRootAsync({
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
})
