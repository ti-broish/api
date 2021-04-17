import { Exclude, Expose, Type } from 'class-transformer';
import { ViolationUpdateType } from '../entities/violation-update.entity';
import { UserDto } from 'src/users/api/user.dto';

@Exclude()
export class ViolationUpdateDto {
  @Expose({ groups: ['read'] })
  id: string;

  @Expose({ groups: ['violation.process'] })
  @Type(() => UserDto)
  actor: UserDto;

  @Expose({ groups: ['violation.process'] })
  @Type(() => Date)
  timestamp: Date;

  @Expose({ groups: ['violation.process'] })
  type: ViolationUpdateType;

  @Expose({ groups: ['violation.process'] })
  payload: object;
}
