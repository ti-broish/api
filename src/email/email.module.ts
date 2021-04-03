import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const user = config.get('SMTP_USER');
        const domain = config.get('SMTP_DOMAIN');
        const pass = config.get('SMTP_PASS');
        const server = config.get('SMTP_SERVER');
        return {
          transport: `smtps://${user}@${domain}:${pass}@${server}`,
          defaults: {
            from: `"Ти Броиш" <${user}@${domain}>`,
          },
        };
      },
    }),
  ],
})
export class EmailModule {}
