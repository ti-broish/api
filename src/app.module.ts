import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SectionsModule } from './sections/sections.module'
import { UsersModule } from './users/users.module'
import { MeModule } from './me/me.module'
import { PartiesModule } from './parties/parties.module'
import {
  configSchema,
  TypeOrmConfigService,
  GoogleRecaptchaConfigService,
} from './config'
import { PicturesModule } from './pictures/pictures.module'
import { ProtocolsModule } from './protocols/protocols.module'
import { ViolationsModule } from './violations/violations.module'
import { CaslModule } from './casl/casl.module'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { I18nExceptionsFilter, NotFoundExceptionFilter } from './filters'
import { StreamsModule } from './streams/streams.module'
import { FirebaseAdminCoreModule } from './firebase/firebase-admin.module'
import { ResultsModule } from './results/results.module'
import { I18nModule, TranslateStatusInterceptor } from './i18n'
import { CommandModule } from 'nestjs-command'
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha'

@Module({
  imports: [
    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: GoogleRecaptchaConfigService,
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
    I18nModule,
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
