import { Ability } from '@casl/ability';
import { Controller, Post, HttpCode, Body, Inject, ValidationPipe, UsePipes, HttpException, HttpStatus, Get, UseGuards, Query, ParseIntPipe, Patch, Param } from '@nestjs/common';
import { FirebaseUser } from '@tfarras/nestjs-firebase-admin';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { PageDTO } from 'src/utils/page.dto';
import { AllowOnlyFirebaseUser, InjectFirebaseUser, InjectUser } from '../../auth/decorators';
import { User } from '../entities';
import { UsersRepository } from '../entities/users.repository';
import RegistrationService, { RegistrationError } from './registration.service';
import { UserDto } from './user.dto';

@Controller('users')
export class UsersController {
  constructor(
    @Inject(RegistrationService) private readonly registration: RegistrationService,
    private readonly repo: UsersRepository,
  ) { }

  @Post()
  @AllowOnlyFirebaseUser()
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: [UserDto.CREATE] }, groups: [UserDto.CREATE] }))
  async create(
    @Body() userDto: UserDto,
    @InjectFirebaseUser() firebaseUser: FirebaseUser,
    @InjectUser() authUser: User|undefined,
  ): Promise<UserDto> {
    try {
      // Only end-users can sign up themselves. Admins cannot create new users on their behalf
      if (authUser !== undefined) {
        throw new RegistrationError(
          'RegistrationForbiddenError',
          'Already authenticated as we have the Firebase UID in our records'
        );
      }
      const user = await this.registration.register(firebaseUser, userDto);

      return UserDto.fromEntity(user);
    } catch (error) {
      console.error(error);
      if (error instanceof RegistrationError) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }

      throw error;
    }
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Manage, User))
  @UsePipes(new ValidationPipe({ transform: true }))
  async get(@Param('id') id: string): Promise<UserDto> {
    return UserDto.fromEntity(await this.repo.findOneOrFail(id));
  }

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Manage, User))
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(@Query() query: PageDTO): Promise<Pagination<User>> {
    const pagination = await paginate(this.repo.getRepo(), { page: query.page, limit: 2, route: '/users' });
    pagination.items.map(UserDto.fromEntity);

    return pagination;
  }

  @Patch(':id')
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Manage, User))
  @UsePipes(new ValidationPipe({ transform: true, transformOptions: { groups: [UserDto.UPDATE, UserDto.MANAGE] }, groups: [UserDto.UPDATE, UserDto.MANAGE], skipMissingProperties: true }))
  async update(@Param('id') id: string, @Body() userDto: UserDto): Promise<UserDto> {
    const user = await this.repo.findOneOrFail(id);
    const updatedUser = await this.repo.update(userDto.updateEntity(user, [UserDto.UPDATE, UserDto.MANAGE]));

    return UserDto.fromEntity(updatedUser);
  }
}
