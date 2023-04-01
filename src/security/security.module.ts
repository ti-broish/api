import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha'
import { ThrottlerModule } from '@nestjs/throttler'
import { GoogleRecaptchaConfigService } from './recaptcha.config'
import { ThrottlerConfig } from './throttler.config'
import { ConfigModule } from 'src/config'

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useClass: ThrottlerConfig,
    }),
    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: GoogleRecaptchaConfigService,
    }),
  ],
})
export class SecurityModule {}
