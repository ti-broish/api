import { Optional } from '@nestjs/common';
import { PageDTO } from "src/utils/page.dto";
import { ViolationStatus } from '../entities/violation.entity';

export class ViolationsFilters extends PageDTO {
  @Optional()
  assignee: string;

  @Optional()
  section: string;

  @Optional()
  status: ViolationStatus;

  @Optional()
  author: string;

  @Optional()
  town: string;

  @Optional()
  organization: number;
}
