import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepository } from './entities/users.repository';
import { Organization, User } from './entities';
import { OrganizationsRepository } from './entities/organizations.repository';
import { MeController, OrganizationsController, UsersController } from './api/controllers';
import RegistrationService from './api/registration.service';
import { IsOrganizationExistsConstraint } from './api/organization-exists.constraint';
import { ProtocolsModule } from 'src/protocols/protocols.module';
import { PicturesModule } from 'src/pictures/pictures.module';
import { ViolationsModule } from 'src/violations/violations.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization]), ProtocolsModule, PicturesModule, ViolationsModule],
  providers: [UsersRepository, OrganizationsRepository, RegistrationService, IsOrganizationExistsConstraint],
  exports: [UsersRepository],
  controllers: [UsersController, MeController, OrganizationsController],
})
export class UsersModule {}
