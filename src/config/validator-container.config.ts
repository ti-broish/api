import { INestApplicationContext } from '@nestjs/common'
import { useContainer } from 'class-validator'

export function useContainerForValidator(
  appModule: INestApplicationContext,
): void {
  useContainer(appModule, { fallbackOnErrors: true })
}
