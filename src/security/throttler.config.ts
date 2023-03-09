import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  ThrottlerModuleOptions,
  ThrottlerOptionsFactory,
} from '@nestjs/throttler'

@Injectable()
export class ThrottlerConfig implements ThrottlerOptionsFactory {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  createThrottlerOptions(): ThrottlerModuleOptions {
    return {
      ttl: this.config.get('throttler.ttl'),
      limit: this.config.get('throttler.limit'),
      ignoreUserAgents: [/^(?!(axios|httpie))/i],
    }
  }
}
