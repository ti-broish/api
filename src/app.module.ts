import * as path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectionsModule } from './sections/sections.module';
import { UsersModule } from './users/users.module';
import { MeModule } from './me/me.module';
import { PartiesModule } from './parties/parties.module';
import { configSchema, TypeOrmConfigService } from './config';
import { PicturesModule } from './pictures/pictures.module';
import { ProtocolsModule } from './protocols/protocols.module';
import { ViolationsModule } from './violations/violations.module';
import { PostsModule } from './posts/posts.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BroadcastsModule } from './broadcasts/broadcasts.module';
import { CaslModule } from './casl/casl.module';
import { AcceptLanguageResolver, I18nJsonParser, I18nModule } from 'nestjs-i18n';
import { APP_FILTER } from '@nestjs/core';
import { I18nExceptionsFilter, NotFoundExceptionFilter } from './filters';
import { StreamsModule } from './streams/streams.module';
import { FirebaseAdminCoreModule } from './firebase/firebase-admin.module';
import { ResultsModule } from './results/results.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ validationSchema: configSchema }),
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get('NEST_LANG', 'bg'),
        parserOptions: {
          path: path.join(__dirname, '/i18n/'),
        },
        resolvers: [
          AcceptLanguageResolver
        ],
      }),
      parser: I18nJsonParser,
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
    PostsModule,
    BroadcastsModule,
    ScheduleModule.forRoot(),
    CaslModule,
    StreamsModule,
    ResultsModule,
    EmailModule,
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
  ]
})
export class AppModule {
  onApplicationBootstrap() {
    if (process.send) {
      process.send('ready');
    }
  }
}
