import { Global, Module, DynamicModule } from '@nestjs/common'
import { FirebaseAdminModuleAsyncOptions } from './firebase-admin.interface'
import {
  FIREBASE_ADMIN_MODULE_OPTIONS,
  FIREBASE_ADMIN_INJECT,
} from './firebase-admin.constants'
import * as admin from 'firebase-admin'

@Global()
@Module({})
export class FirebaseAdminCoreModule {
  static forRoot(options: admin.AppOptions): DynamicModule {
    const firebaseAdminModuleOptions = {
      provide: FIREBASE_ADMIN_MODULE_OPTIONS,
      useValue: options,
    }

    const app =
      admin.apps.length === 0 ? admin.initializeApp(options) : admin.apps[0]

    const firebaseAuthencationProvider = {
      provide: FIREBASE_ADMIN_INJECT,
      useValue: app,
    }

    return {
      module: FirebaseAdminCoreModule,
      providers: [firebaseAdminModuleOptions, firebaseAuthencationProvider],
      exports: [firebaseAdminModuleOptions, firebaseAuthencationProvider],
    }
  }

  static forRootAsync(options: FirebaseAdminModuleAsyncOptions): DynamicModule {
    const firebaseAdminModuleOptions = {
      provide: FIREBASE_ADMIN_MODULE_OPTIONS,
      useFactory: options.useFactory || (() => ({})),
      inject: options.inject || [],
    }

    const firebaseAuthencationProvider = {
      provide: FIREBASE_ADMIN_INJECT,
      useFactory: (opt: admin.AppOptions) => {
        const app =
          admin.apps.length === 0 ? admin.initializeApp(opt) : admin.apps[0]

        return app
      },
      inject: [FIREBASE_ADMIN_MODULE_OPTIONS],
    }

    return {
      module: FirebaseAdminCoreModule,
      imports: options.imports,
      providers: [firebaseAdminModuleOptions, firebaseAuthencationProvider],
      exports: [firebaseAdminModuleOptions, firebaseAuthencationProvider],
    }
  }
}
