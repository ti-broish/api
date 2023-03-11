import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ConfigModule } from '../config'
import { FirebaseAdminCoreModule } from './firebase-admin.module'

@Module({
  imports: [
    FirebaseAdminCoreModule.forRootAsync({
      imports: [],
      inject: [],
    }),
  ],
})
export class FirebaseModule {}
