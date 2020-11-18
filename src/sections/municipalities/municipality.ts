import { ApiProperty } from '@nestjs/swagger';
import { ElectionRegion } from '../electionRegions/electionRegion';

export class Municipality {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  electionRegion: ElectionRegion;
}
