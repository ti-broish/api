import { Expose, plainToClass, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Party } from 'src/parties/entities/party.entity';
import { PartyDto } from '../../parties/api/party.dto';
import { ProtocolData } from '../entities/protocol-data.entity';
import { ProtocolResult } from '../entities/protocol-result.entity';
import { Protocol } from '../entities/protocol.entity';

export class ProtocolResultDto {
  @Transform((id: number) => plainToClass(PartyDto, { id }, { groups: ['create'] }), { groups: ['create', 'finalize'] })
  @ValidateNested({
    groups: ['create', 'finalize'],
  })
  @Type(() => PartyDto)
  @Expose({ groups: ['read', 'create', 'finalize'] })
  party: PartyDto;

  @IsNumber({}, { groups: ['create', 'finalize'] })
  @IsNotEmpty({ groups: ['create', 'finalize'] })
  @Min(0, { groups: ['create', 'finalize'] })
  @IsInt({ groups: ['create', 'finalize'] })
  @Expose({ groups: ['read', 'create', 'finalize'] })
  validVotesCount: number;

  @IsOptional({ groups: ['read', 'finalize'] })
  @IsNumber({}, { groups: ['finalize'] })
  @Min(0, { groups: ['finalize'] })
  @IsInt({ groups: ['finalize'] })
  @Expose({ groups: ['read', 'finalize'] })
  invalidVotesCount?: number;

  public toEntity(): ProtocolResult {
    return plainToClass<ProtocolResult, Partial<ProtocolResultDto>>(ProtocolResult, this, {
      groups: ['create', 'finalize'],
    });
  }

  public static fromEntity(entity: ProtocolResult): ProtocolResultDto {
    return plainToClass<ProtocolResultDto, Partial<Protocol>>(ProtocolResultDto, entity, {
      excludeExtraneousValues: true,
      groups: ['read'],
    });
  }
}

export class ProtocolResultsDto {
  @IsOptional({ groups: ['read', 'finalize'] })
  @IsNumber({}, { groups: ['finalize'] })
  @IsInt({ groups: ['finalize'] })
  @Min(0, { groups: ['finalize'] })
  @Expose({ groups: ['read', 'finalize'] })
  validVotesCount?: number;

  @IsOptional({ groups: ['read', 'finalize'] })
  @IsNumber({}, { groups: ['finalize'] })
  @IsInt({ groups: ['finalize'] })
  @Min(0, { groups: ['finalize'] })
  @Expose({ groups: ['read', 'finalize'] })
  invalidVotesCount?: number;

  @IsOptional({ groups: ['read', 'finalize'] })
  @IsNumber({}, { groups: ['finalize'] })
  @IsInt({ groups: ['finalize'] })
  @Min(0, { groups: ['finalize'] })
  @Expose({ groups: ['read', 'finalize'] })
  machineVotesCount?: number;

  @Type(() => ProtocolResultDto)
  @IsNotEmpty({ groups: ['create', 'finalize'] })
  @IsArray({ groups: ['create', 'finalize'] })
  @ArrayNotEmpty({ groups: ['create', 'finalize'] })
  @ValidateNested({
    each: true,
    groups: ['create', 'finalize']
  })
  @Expose({ groups: ['read', 'create', 'finalize'] })
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

  public toProtocolData(): ProtocolData {
    return plainToClass<ProtocolData, Partial<ProtocolResultsDto>>(ProtocolData, this, {
      groups: ['finalize'],
    });
  }
}
