import { Expose, plainToClass, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Party } from 'src/parties/entities/party.entity';
import { PartyDto } from '../../parties/api/party.dto';
import { ProtocolData } from '../entities/protocol-data.entity';
import { ProtocolResult } from '../entities/protocol-result.entity';
import { Protocol } from '../entities/protocol.entity';

@Expose({ groups: ['read', 'create'] })
export class ProtocolResultDto {
  @Type(() => PartyDto)
  @Transform((id: number) => plainToClass(PartyDto, { id }, { groups: ['create'] }), { groups: ['create'] })
  @ValidateNested({
    groups: ['create'],
  })
  @Expose({ groups: ['read', 'create'] })
  party: PartyDto;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @IsInt()
  @Expose({ groups: ['read', 'create'] })
  validVotesCount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @IsInt()
  @Expose({ groups: ['read', 'create'] })
  invalidVotesCount?: number;

  public toEntity(): ProtocolResult {
    return plainToClass<ProtocolResult, Partial<ProtocolResultDto>>(ProtocolResult, this, {
      groups: ['create'],
    });
  }

  public static fromEntity(entity: ProtocolResult): ProtocolResultDto {
    return plainToClass<ProtocolResultDto, Partial<Protocol>>(ProtocolResultDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    });
  }
}

@Expose({ groups: ['read', 'create'] })
export class ProtocolResultsDto {
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  @Expose({ groups: ['read', 'create'] })
  validVotesCount?: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  @Expose({ groups: ['read', 'create'] })
  invalidVotesCount?: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  @Expose({ groups: ['read', 'create'] })
  machineVotesCount?: number;

  @Type(() => ProtocolResultDto)
  @IsArray({ groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  @ArrayNotEmpty({ groups: ['create'] })
  @ValidateNested({
    each: true,
    groups: ['create'],
  })
  @Expose({ groups: ['read', 'create'] })
  results: ProtocolResultDto[] = [];

  public static fromEntity(protocol: Protocol): ProtocolResultsDto {
    const resultsDto = protocol.data ?
      plainToClass<ProtocolResultsDto, Partial<ProtocolData>>(ProtocolResultsDto, protocol.data, {
        excludeExtraneousValues: true,
        groups: ['read'],
      })
      : new ProtocolResultsDto();
    resultsDto.results = protocol.getResults().map(
      (result: ProtocolResult): ProtocolResultDto => ProtocolResultDto.fromEntity(result)
    );

    return resultsDto;
  }

  public toResults(): ProtocolResult[] {
    return this.results.map((resultDto: ProtocolResultDto): ProtocolResult => resultDto.toEntity());
  }

  public toVotersData(): ProtocolData {
    return plainToClass<ProtocolData, Partial<ProtocolResultsDto>>(ProtocolData, this, {
      groups: ['create'],
    });
  }
}
