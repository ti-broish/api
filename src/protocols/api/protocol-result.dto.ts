import { Expose, plainToClass, Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartyDto } from '../../parties/api/party.dto';
import { ProtocolResult } from '../entities/protocol-result.entity';
import { Protocol } from '../entities/protocol.entity';

export class ProtocolResultDto {
  @Transform(
    ({ value: id }) => plainToClass(PartyDto, { id }, { groups: ['create'] }),
    { groups: ['create', 'replace'] },
  )
  @ValidateNested({
    groups: ['create', 'replace'],
  })
  @Type(() => PartyDto)
  @Expose({ groups: ['read', 'create', 'replace'] })
  party: PartyDto;

  @Expose({ groups: ['read'] })
  validVotesCount: number;

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { each: true, groups: ['replace'] })
  @IsNotEmpty({ groups: ['replace'] })
  @Min(0, { each: true, groups: ['replace'] })
  @IsInt({ each: true, groups: ['replace'] })
  @Expose({ groups: ['read', 'replace'] })
  @IsArray({ groups: ['replace'] })
  @ArrayNotEmpty({ groups: ['replace'] })
  machineVotes?: number[];

  @IsOptional({ groups: ['read', 'replace'] })
  @IsNumber({}, { groups: ['replace'] })
  @IsNotEmpty({ groups: ['replace'] })
  @Min(0, { groups: ['replace'] })
  @IsInt({ groups: ['replace'] })
  @Expose({ groups: ['read', 'replace'] })
  nonMachineVotesCount?: number;

  public toEntity(): ProtocolResult {
    const protocolResult = plainToClass<
      ProtocolResult,
      Partial<ProtocolResultDto>
    >(ProtocolResult, this, {
      groups: ['create', 'replace'],
    });
    const validVotes = (protocolResult.machineVotes || []).concat([
      protocolResult.nonMachineVotesCount || 0,
    ]);

    protocolResult.validVotesCount = validVotes.reduce(
      (sum: number, votes: number): number => sum + votes,
    );

    return protocolResult;
  }

  public static fromEntity(entity: ProtocolResult): ProtocolResultDto {
    return plainToClass<ProtocolResultDto, Partial<Protocol>>(
      ProtocolResultDto,
      entity,
      {
        excludeExtraneousValues: true,
        groups: ['read'],
      },
    );
  }
}
