import { Expose, plainToClass, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Party } from 'src/parties/entities/party.entity';
import { PartyDto } from '../../parties/api/party.dto';
import { ProtocolData } from '../entities/protocol-data.entity';
import { ProtocolResult } from '../entities/protocol-result.entity';
import { Protocol } from '../entities/protocol.entity';

export class ProtocolResultDto {
  @Transform(({ value: id }) => plainToClass(PartyDto, { id }, { groups: ['create'] }), { groups: ['create', 'replace'] })
  @ValidateNested({
    groups: ['create', 'replace'],
  })
  @Type(() => PartyDto)
  @Expose({ groups: ['read', 'create', 'replace'] })
  party: PartyDto;

  @IsNumber({}, { groups: ['create', 'replace'] })
  @IsNotEmpty({ groups: ['create', 'replace'] })
  @Min(0, { groups: ['create', 'replace'] })
  @IsInt({ groups: ['create', 'replace'] })
  @Expose({ groups: ['read', 'create', 'replace'] })
  validVotesCount: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsNotEmpty({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Expose({ groups: ['read', 'replace'] })
  machineVotesCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsNotEmpty({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Expose({ groups: ['read', 'replace'] })
  nonMachineVotesCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Expose({ groups: ['read', 'replace'] })
  invalidVotesCount?: number;

  public toEntity(): ProtocolResult {
    return plainToClass<ProtocolResult, Partial<ProtocolResultDto>>(ProtocolResult, this, {
      groups: ['create', 'replace'],
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
  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Expose({ groups: ['read', 'replace'] })
  votersCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Expose({ groups: ['read', 'replace'] })
  validVotesCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Expose({ groups: ['read', 'replace'] })
  invalidVotesCount?: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Expose({ groups: ['read', 'replace'] })
  machineVotesCount?: number;

  @Type(() => ProtocolResultDto)
  @IsNotEmpty({ groups: ['create', 'replace'] })
  @IsArray({ groups: ['create', 'replace'] })
  @ArrayNotEmpty({ groups: ['create', 'replace'] })
  @ValidateNested({
    each: true,
    groups: ['create', 'replace']
  })
  @Expose({ groups: ['read', 'create', 'replace'] })
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
      groups: ['replace'],
    });
  }
}
