import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirebaseAdminCoreModule } from '@tfarras/nestjs-firebase-admin';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectionsModule } from './sections/sections.module';
import { UsersModule } from './users/users.module';
import { PartiesModule } from './parties/parties.module';
import { configSchema, TypeOrmConfigService } from './config';
import { PicturesModule } from './pictures/pictures.module';
import { ProtocolsModule } from './protocols/protocols.module';
import { ViolationsModule } from './violations/violations.module';
import { PostsModule } from './posts/posts.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BroadcastsModule } from './broadcasts/broadcasts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ validationSchema: configSchema }),
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
    SectionsModule,
    PartiesModule,
    PicturesModule,
    ProtocolsModule,
    ViolationsModule,
    PostsModule,
    BroadcastsModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
