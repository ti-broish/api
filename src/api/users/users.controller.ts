import { Controller, Get, Post, HttpCode, Param, Body, Delete, Inject } from '@nestjs/common';
import { FirebaseAdminSDK, FIREBASE_ADMIN_INJECT } from '@tfarras/nestjs-firebase-admin';
import { Public } from 'src/auth/public.decorator';
import { User } from './user';
import { UserCreateDto } from './userCreate.dto';

@Controller('users')
export class UsersController {
  constructor(
    @Inject(FIREBASE_ADMIN_INJECT) private readonly fireSDK: FirebaseAdminSDK,
  ) { }

  @Post()
  @Public()
  @HttpCode(201)
  create(@Body() userCreateDto: UserCreateDto): User {
    return new User();
  }

  @Get(':id')
  @HttpCode(200)
  get(@Param('id') id: number): User {
    return new User();
  }

  @Delete(':id')
  @HttpCode(202)
  delete(@Param('id') id: number): string {
    return 'deleted';
  }
}
