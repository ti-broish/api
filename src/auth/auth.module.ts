import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { FirebaseGuard } from "./firebase.guard";
import { FirebaseStrategy } from "./firebase.strategy";

@Module({
  imports: [PassportModule, UsersModule],
  providers: [
    FirebaseStrategy,
    // Provide default authentication to all controllers
    {
      provide: APP_GUARD,
      useClass: FirebaseGuard
    }
  ],
  exports: [FirebaseStrategy],
  controllers: [],
})
export class AuthModule { }
