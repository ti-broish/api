import { Optional } from '@nestjs/common';
import { PageDTO } from "src/utils/page.dto";

export class ProtocolFilters extends PageDTO {
  @Optional()
  assignee: string;

  @Optional()
  section: string;
}
