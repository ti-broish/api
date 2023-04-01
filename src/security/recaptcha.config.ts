import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  GoogleRecaptchaModuleOptions,
  GoogleRecaptchaOptionsFactory,
} from '@nestlab/google-recaptcha/interfaces/google-recaptcha-module-options'
import { Request } from 'express'

@Injectable()
export class GoogleRecaptchaConfigService
  implements GoogleRecaptchaOptionsFactory
{
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  createGoogleRecaptchaOptions(): GoogleRecaptchaModuleOptions {
    const ipAllowlist = (this.config.get<string>('IP_ALLOWLIST') || '')
      .split(',')
      .filter((x) => x.trim())
    const userAgentAllowlist = (
      this.config.get<string>('USER_AGENT_ALLOWLIST') || ''
    )
      .split(',')
      .filter((x) => !!x.trim())
      .map((x) => new RegExp(x.trim(), 'i'))

    return {
      score: this.config.get<number>('GOOGLE_RECAPTCHA_SCORE'),
      secretKey: this.config.get<string>('GOOGLE_RECAPTCHA_SECRET_KEY'),
      debug: this.config.get<boolean>('GOOGLE_RECAPTCHA_DEBUG'),
      response: (req: Request) =>
        (req.headers['x-recaptcha-token'] as string) ?? '',
      skipIf: (req) => {
        if (this.config.get<boolean>('GOOGLE_RECAPTCHA_ENABLED') === false) {
          return true
        }

        const r = <Request>req

        const ip = (r.headers['x-forwarded-for'] as string) ?? r.ip

        if (ipAllowlist.includes(ip)) {
          return true
        }

        if (userAgentAllowlist.some((x) => x.test(r.headers['user-agent']))) {
          return true
        }
      },
    }
  }
}
