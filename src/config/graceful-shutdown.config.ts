import { INestApplication, ShutdownSignal } from '@nestjs/common';

export function enableGracefulShutfown(app: INestApplication) {
  app.enableShutdownHooks([ShutdownSignal.SIGINT, ShutdownSignal.SIGTERM]);
}
