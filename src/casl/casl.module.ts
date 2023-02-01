import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CaslAbilityFactory } from './casl-ability.factory'

@Module({
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
  imports: [ConfigModule],
})
export class CaslModule {}
