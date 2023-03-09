import { Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config'
import { configSchema } from './schema.config'

@Module({
  imports: [
    NestConfigModule.forRoot({
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
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
