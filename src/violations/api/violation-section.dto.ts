import { IsNotEmpty, IsString, Matches } from 'class-validator'

export const VIOLATION_SECTION_INVALID_FORMAT =
  'VIOLATION_SECTION_INVALID_FORMAT'

export class ViolationSectionDto {
  @IsNotEmpty({ message: VIOLATION_SECTION_INVALID_FORMAT })
  @IsString({ message: VIOLATION_SECTION_INVALID_FORMAT })
  @Matches(/^\d{9}$/, { message: VIOLATION_SECTION_INVALID_FORMAT })
  section: string
}
