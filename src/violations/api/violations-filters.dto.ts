import { Optional } from '@nestjs/common';
import { PageDTO } from 'src/utils/page.dto';
import { ViolationStatus } from '../entities/violation.entity';

export class ViolationsFilters extends PageDTO {
  @Optional()
  assignee: string;

  @Optional()
  section: string;

  @Optional()
  status: ViolationStatus;

  @Optional()
  electionRegion: string;

  @Optional()
  municipality: string;

  @Optional()
  country: string;

  @Optional()
  town: number;

  @Optional()
  cityRegion: string;

  @Optional()
  organization: number;

  @Optional()
  published: boolean;
}
