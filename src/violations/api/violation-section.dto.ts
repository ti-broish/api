import { IsNotEmpty, IsNumberString, IsString, Length } from 'class-validator'
import { Section } from '../../sections/entities/section.entity'

export class ViolationSectionDto {
  @IsNotEmpty()
  @IsString()
  @Length(Section.SECTION_ID_LENGTH, Section.SECTION_ID_LENGTH)
  @IsNumberString({ no_symbols: true })
  section: string
}
