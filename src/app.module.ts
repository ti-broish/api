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

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvVars: true,
      validationSchema: configSchema,
      validationOptions: {
        allowUnknown: true,
        cache: false, // process.env.NODE_ENV === 'production',
        debug: true, // process.env.NODE_ENV !== 'production',
        stack: true, // process.env.NODE_ENV !== 'production',
      },
      envFilePath: ['.env'],
      cache: false, // process.env.NODE_ENV === 'production',
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
