import { Optional } from '@nestjs/common';
import { UserDto } from 'src/users/api/user.dto';
import { PageDTO } from "src/utils/page.dto";
import { ProtocolStatus } from '../entities/protocol.entity';

export class ProtocolFilters extends PageDTO {
  @Optional()
  assignee: string;

  @Optional()
  section: string;

  @Optional()
  status: ProtocolStatus;

  @Optional()
  author: string;
}
