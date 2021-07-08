import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { FirebaseGuard } from './firebase.guard';
import { BasicStrategy } from './auth-basic.strategy';
import { FirebaseStrategy } from './firebase.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PassportModule, UsersModule, ConfigModule],
  providers: [
    FirebaseStrategy,
    // Provide default authentication to all controllers
    {
      provide: APP_GUARD,
      useClass: FirebaseGuard,
    },
    BasicStrategy,
  ],
  exports: [FirebaseStrategy],
  controllers: [],
})
export class AuthModule {}
