import { NestFactory } from '@nestjs/core'
import { CommandModule, CommandService } from 'nestjs-command'
import { AppModule } from './app'
void (async () => {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  })
  app.select(CommandModule).get(CommandService).exec()
})()
