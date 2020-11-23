import { ApiProperty } from '@nestjs/swagger';
import { Town } from '../towns/town';

export class CityRegion {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  town: Town;
}
