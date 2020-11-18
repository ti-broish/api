import { ApiProperty } from '@nestjs/swagger';
import { Country } from '../countries/country';
import { Municipality } from '../municipalities/municipality';

export class Town {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  country: Country;

  municipality: Municipality;
}
