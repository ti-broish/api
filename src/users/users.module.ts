import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepository } from './entities/users.repository';
import { Organization, User } from './entities';
import { OrganizationsRepository } from './entities/organizations.repository';
import { OrganizationsController, UsersController } from './api/controllers';
import RegistrationService from './api/registration.service';
import { IsOrganizationExistsConstraint } from './api/organization-exists.constraint';
import { IsUserExistsConstraint } from './api/user-exists.constraint';
import { CaslModule } from 'src/casl/casl.module';
import { Client } from './entities/client.entity';
import { ClientsRepository } from './entities/clients.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, Client]), CaslModule],
  providers: [UsersRepository, OrganizationsRepository, ClientsRepository, RegistrationService, IsOrganizationExistsConstraint, IsUserExistsConstraint],
  exports: [UsersRepository, ClientsRepository],
  controllers: [UsersController, OrganizationsController],
})
export class UsersModule {}
