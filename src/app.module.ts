import * as path from 'path'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SectionsModule } from './sections/sections.module'
import { UsersModule } from './users/users.module'
import { MeModule } from './me/me.module'
import { PartiesModule } from './parties/parties.module'
import { configSchema, TypeOrmConfigService } from './config'
import { PicturesModule } from './pictures/pictures.module'
import { ProtocolsModule } from './protocols/protocols.module'
import { ViolationsModule } from './violations/violations.module'
import { ScheduleModule } from '@nestjs/schedule'
import { CaslModule } from './casl/casl.module'
import { AcceptLanguageResolver, I18nJsonLoader, I18nModule } from 'nestjs-i18n'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { I18nExceptionsFilter, NotFoundExceptionFilter } from './filters'
import { StreamsModule } from './streams/streams.module'
import { FirebaseAdminCoreModule } from './firebase/firebase-admin.module'
import { ResultsModule } from './results/results.module'
import { TranslateStatusInterceptor } from './i18n/translate-status.interceptor'
import { CommandModule } from 'nestjs-command'
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha'
import { Request } from 'express'

@Module({
  imports: [
    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        score: configService.get('GOOGLE_RECAPTCHA_SCORE'),
        secretKey: configService.get('GOOGLE_RECAPTCHA_SECRET_KEY'),
        response: (req: Request) =>
          (req.headers['x-recaptcha-token'] as string) ?? '',
        skipIf: configService.get('GOOGLE_RECAPTCHA_ENABLED') === false,
      }),
    }),
    ConfigModule.forRoot({
      ignoreEnvVars: true,
      validationSchema: configSchema,
      validationOptions: {
        allowUnknown: true,
        cache: process.env.NODE_ENV === 'production',
        debug: process.env.NODE_ENV !== 'production',
        stack: process.env.NODE_ENV !== 'production',
      },
      envFilePath: ['.env'],
      cache: process.env.NODE_ENV === 'production',
    }),
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get('NEST_LANG', 'bg'),
        loaderOptions: {
          path: path.join(__dirname, '/i18n/'),
        },
      }),
      resolvers: [AcceptLanguageResolver],
      loader: I18nJsonLoader,
      inject: [ConfigService],
    }),
    FirebaseAdminCoreModule.forRootAsync({
      useFactory: () => ({}),
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
    AuthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: TypeOrmConfigService,
    }),
    UsersModule,
    MeModule,
    SectionsModule,
    PartiesModule,
    PicturesModule,
    ProtocolsModule,
    ViolationsModule,
    ScheduleModule.forRoot(),
    CaslModule,
    StreamsModule,
    ResultsModule,
    CommandModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: NotFoundExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: I18nExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TranslateStatusInterceptor,
    },
  ],
})
export class AppModule {
  onApplicationBootstrap() {
    if (process.send) {
      process.send('ready')
    }
  }
}
