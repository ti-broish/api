import { Expose, plainToClass, Transform, Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { PartyDto } from '../../parties/api/party.dto'
import { ProtocolResult } from '../entities/protocol-result.entity'
import { Protocol } from '../entities/protocol.entity'

export class ProtocolResultDto {
  @Transform(
    ({ value: id }) => plainToClass(PartyDto, { id }, { groups: ['create'] }),
    { groups: ['create', 'replace'] },
  )
  @ValidateNested({
    groups: ['create', 'replace'],
  })
  @Type(() => PartyDto)
  @Expose({
    groups: ['read', 'create', 'replace', 'protocol.protocolInResults'],
  })
  party: PartyDto

  @Expose({
    groups: ['read', 'replace', 'protocol.protocolInResults', 'compare'],
  })
  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsNotEmpty({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  validVotesCount: number

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { each: true, groups: ['replace'] })
  @IsNotEmpty({ groups: ['replace'] })
  @Min(0, { each: true, groups: ['replace'] })
  @Max(5000, { each: true, groups: ['replace'] })
  @IsInt({ each: true, groups: ['replace'] })
  @Expose({
    groups: ['read', 'replace', 'protocol.protocolInResults', 'compare'],
  })
  @IsArray({ groups: ['replace'] })
  @ArrayNotEmpty({ groups: ['replace'] })
  machineVotes?: number[]

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsNotEmpty({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @Max(5000, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Expose({
    groups: ['read', 'replace', 'protocol.protocolInResults', 'compare'],
  })
  nonMachineVotesCount?: number

  public toEntity(): ProtocolResult {
    return plainToClass<ProtocolResult, Partial<ProtocolResultDto>>(
      ProtocolResult,
      this,
      {
        groups: ['create', 'replace'],
      },
    )
  }

  public static fromEntity(entity: ProtocolResult): ProtocolResultDto {
    return plainToClass<ProtocolResultDto, Partial<Protocol>>(
      ProtocolResultDto,
      entity,
      {
        excludeExtraneousValues: true,
        groups: ['read'],
      },
    )
  }
}
