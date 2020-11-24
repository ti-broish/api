import * as admin from 'firebase-admin';
import { Inject, Injectable } from '@nestjs/common';
import { FIREBASE_ADMIN_INJECT, FirebaseAdminSDK, FirebaseUser } from '@tfarras/nestjs-firebase-admin';

@Injectable()
export class FirebaseService {
  constructor(
    @Inject(FIREBASE_ADMIN_INJECT) private firebaseAdmin: FirebaseAdminSDK,
  ) {}

  getUsers(): Promise<admin.auth.ListUsersResult> {
    return this.firebaseAdmin.auth().listUsers();
  }
}
