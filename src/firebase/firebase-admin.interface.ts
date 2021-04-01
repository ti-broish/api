import * as admin from 'firebase-admin';
import { ModuleMetadata } from '@nestjs/common/interfaces';

export interface FirebaseAdminModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  useFactory?: (
    ...args: any[]
  ) => Promise<admin.AppOptions> | admin.AppOptions;
  inject?: any[];
}
