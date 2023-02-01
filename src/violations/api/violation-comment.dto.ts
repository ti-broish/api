import { Exclude, Expose, plainToClass, Type } from 'class-transformer'
import { IsNotEmpty, MaxLength, MinLength } from 'class-validator'
import { ViolationComment } from '../entities/violation-comment.entity'
import { UserDto } from 'src/users/api/user.dto'

@Exclude()
export class ViolationCommentDto {
  @Expose({ groups: ['violation.process'] })
  id: string

  @Expose({ groups: ['violation.process'] })
  @Type(() => UserDto)
  author: UserDto

  @Expose({ groups: ['violation.process', 'create'] })
  @MinLength(10, { groups: ['create'] })
  @MaxLength(2000, { groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  text: string

  @Expose({ groups: ['violation.process'] })
  @Type(() => Date)
  createdAt: Date

  public toEntity(): ViolationComment {
    return plainToClass<ViolationComment, Partial<ViolationCommentDto>>(
      ViolationComment,
      this,
      {
        groups: ['create'],
      },
    )
  }

  public static fromEntity(entity: ViolationComment): ViolationCommentDto {
    return plainToClass<ViolationCommentDto, Partial<ViolationComment>>(
      ViolationCommentDto,
      entity,
      {
        excludeExtraneousValues: true,
        groups: ['violation.process'],
      },
    )
  }
}
