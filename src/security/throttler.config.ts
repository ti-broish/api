import { ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  ThrottlerModuleOptions,
  ThrottlerOptionsFactory,
} from '@nestjs/throttler'
import { Request } from 'express'

@Injectable()
export class ThrottlerConfig implements ThrottlerOptionsFactory {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  createThrottlerOptions(): ThrottlerModuleOptions {
    const allowlist = (this.config.get<string>('IP_ALLOWLIST') || '')
      .split(',')
      .filter((x) => x.trim())

    return {
      ttl: this.config.get('throttler.ttl'),
      limit: this.config.get('throttler.limit'),
      ignoreUserAgents: [/^axios/i, /^httpie/i],
      skipIf: (context: ExecutionContext) => {
        if (this.config.get('NODE_ENV') === 'development') return true
        const request: Request = context.switchToHttp().getRequest()
        const ip =
          <string | undefined>request.headers['x-forwarded-for'] || request.ip
        return allowlist.includes(ip)
      },
    }
  }
}
