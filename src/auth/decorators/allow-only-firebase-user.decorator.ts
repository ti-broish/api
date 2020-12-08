import { SetMetadata } from '@nestjs/common';

export const ALLOW_ONLY_FIREBASE_USER = 'allowOnlyFirebaseUser';
// Set @AllowOnlyFirebaseUser() to any route which should bypass user exists in db check
export const AllowOnlyFirebaseUser = () => SetMetadata(ALLOW_ONLY_FIREBASE_USER, true);
