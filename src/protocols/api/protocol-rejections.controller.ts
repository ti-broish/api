import { Ability } from '@casl/ability';
import {
  Controller,
  Get,
  HttpCode,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Action } from 'src/casl/action.enum';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { Protocol, ProtocolRejectionReason } from '../entities/protocol.entity';

interface RejectionReasonResponse {
  [key: string]: string;
}

@Controller('protocols/rejection-reasons')
export class ProtocolRejectionsController {
  constructor(private readonly i18n: I18nService) {}

  @Get()
  @HttpCode(200)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: Ability) => ability.can(Action.Update, Protocol))
  @UsePipes(new ValidationPipe({ transform: true }))
  async index(): Promise<RejectionReasonResponse[]> {
    return await Promise.all(
      Object.keys(ProtocolRejectionReason).map((rejectionReasonKey) =>
        this.formatReason(
          rejectionReasonKey,
          ProtocolRejectionReason[rejectionReasonKey],
        ),
      ),
    );
  }

  private async formatReason(
    rejectionReasonKey: string,
    rejectionReasonValue: string,
  ): Promise<RejectionReasonResponse> {
    return {
      rejectionReason: rejectionReasonValue,
      rejectionReasonLocalized: await this.i18n.translate(
        `protocol.REJECTION_REASON_${rejectionReasonKey.toUpperCase()}`,
      ),
    } as RejectionReasonResponse;
  }
}
