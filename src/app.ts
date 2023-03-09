import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { CaslModule } from './casl/casl.module'
import { CommandModule } from 'nestjs-command'
import { ConfigModule } from './config'
import { DatabaseModule } from './database'
import { FirebaseModule } from './firebase'
import { HttpModule } from './http'
import { I18nModule } from './i18n'
import { MeModule } from './me/me.module'
import { PartiesModule } from './parties/parties.module'
import { PicturesModule } from './pictures/pictures.module'
import { ProtocolsModule } from './protocols/protocols.module'
import { ResultsModule } from './results/results.module'
import { SectionsModule } from './sections/sections.module'
import { SecurityModule } from './security/security.module'
import { StreamsModule } from './streams/streams.module'
import { UsersModule } from './users/users.module'
import { ViolationsModule } from './violations/violations.module'

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    SecurityModule,
    I18nModule,
    FirebaseModule,
    AuthModule,
    DatabaseModule,
    UsersModule,
    MeModule,
    SectionsModule,
    PartiesModule,
    PicturesModule,
    ProtocolsModule,
    ViolationsModule,
    CaslModule,
    StreamsModule,
    ResultsModule,
    CommandModule,
  ],
})
export class AppModule {
  onApplicationBootstrap() {
    if (process.send) {
      process.send('ready')
    }
  }
}
