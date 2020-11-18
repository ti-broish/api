import { Controller, Get, Post, HttpCode, Param, Body, Delete } from '@nestjs/common';
import { User } from './user';
import { UserCreateDto } from './userCreate.dto';

@Controller('users')
export class UsersController {
  @Post()
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
