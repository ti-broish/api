import { BreadcrumbDto } from './breadcrumb.dto';

export class SectionDetailsResultDto {
  results: number[];

  number: string;

  region: number;

  name: string;

  placeId: string;

  place: string;

  mobile = false;

  ship = false;

  totalBallots: number | null;

  voters: number;

  additionalVoters: number;

  voter: number;

  unusedBallots: number;

  destroyedBallots: number;

  invalidVotes265: number;

  invalidVotes227: number;

  invalidVotes228: number;

  wrongVotes267: number;

  totalVotes: number;

  invalidVotes: number;

  validVotes: number;

  validCandidateVotes: number;

  validNAVotes: number;

  emptyVotes: number;

  abroad: boolean;

  crumbs: BreadcrumbDto[];
}
