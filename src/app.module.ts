import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirebaseAdminCoreModule } from '@tfarras/nestjs-firebase-admin';
import * as Joi from '@hapi/joi';
import { AuthModule } from './auth/auth.module';
import { FirebaseService } from './auth/firebase.service';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().default(3000),
        GOOGLE_CLOUD_PROJECT: Joi.string().required(),
        GOOGLE_APPLICATION_CREDENTIALS: Joi.string().required(),
      }),
    }),
    FirebaseAdminCoreModule.forRootAsync({
      useFactory: () => ({}),
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
    AuthModule,
    ApiModule
  ],
  providers: [
    FirebaseService
  ],
})
export class AppModule {}
