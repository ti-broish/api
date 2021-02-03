import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepository } from './entities/users.repository';
import { Organization, User } from './entities';
import { OrganizationsRepository } from './entities/organizations.repository';
import { MeController, OrganizationsController, UsersController } from './api/controllers';
import RegistrationService from './api/registration.service';
import { IsOrganizationExistsConstraint } from './api/organization-exists.constraint';
import { ProtocolsModule } from '../protocols/protocols.module';
import { PicturesModule } from '../pictures/pictures.module';
import { ViolationsModule } from '../violations/violations.module';
import { IsUserExistsConstraint } from './api/user-exists.constraint';
import { ClientsRepository } from './entities/clients.repository';
import { Client } from './entities/client.entity';
import { CaslModule } from 'src/casl/casl.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, Client]), CaslModule, ProtocolsModule, PicturesModule, ViolationsModule],
  providers: [UsersRepository, OrganizationsRepository, ClientsRepository, RegistrationService, IsOrganizationExistsConstraint, IsUserExistsConstraint],
  exports: [UsersRepository, ClientsRepository],
  controllers: [UsersController, MeController, OrganizationsController],
})
export class UsersModule {}
