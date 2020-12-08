import { SetMetadata } from '@nestjs/common';

export const ALLOW_ONLY_FIREBASE_USER = 'allowOnlyFirebaseUser';
// Allow setting @Public() to any route which should bypass authentication
export const AllowOnlyFirebaseUser = () => SetMetadata(ALLOW_ONLY_FIREBASE_USER, true);
