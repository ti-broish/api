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
    const allowlist = (this.config.get<string>('IP_ALLOWLIST') || '')
      .split(',')
      .filter((x) => x.trim())

    return {
      score: this.config.get<number>('GOOGLE_RECAPTCHA_SCORE'),
      secretKey: this.config.get<string>('GOOGLE_RECAPTCHA_SECRET_KEY'),
      response: (req: Request) =>
        (req.headers['x-recaptcha-token'] as string) ?? '',
      skipIf: (req) => {
        if (this.config.get<boolean>('GOOGLE_RECAPTCHA_ENABLED') === false) {
          return true
        }

        const r = <Request>req

        const ip = (r.headers['x-forwarded-for'] as string) ?? r.ip

        return allowlist.includes(ip)
      },
    }
  }
}
