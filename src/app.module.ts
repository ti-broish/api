import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirebaseAdminCoreModule } from '@tfarras/nestjs-firebase-admin';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectionsModule } from './sections/sections.module';
import { UsersModule } from './users/users.module';
import { configSchema, TypeOrmConfigService } from './config';

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
  ],
})
export class AppModule {}
