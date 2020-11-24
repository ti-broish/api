import { Controller, Get, Post, HttpCode, Param } from '@nestjs/common';
import * as admin from 'firebase-admin';


@Controller('firebase')
export class FirebaseController {
  @Get()
  @HttpCode(200)
  async index() {
    // return await admin.messaging().sendToDevice(fcmtoken, payload);
  }
}
