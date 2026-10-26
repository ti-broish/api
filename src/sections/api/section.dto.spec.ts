import { Section } from '../entities/section.entity'
import { SectionDto } from './section.dto'

const section = (fields: Partial<Section>): Section =>
  Object.assign(new Section(), { code: fields.id?.slice(6) }, fields)

describe('SectionDto address', () => {
  it('exposes the address of an abroad section from the address column', () => {
    const dto = SectionDto.fromEntity(
      section({
        id: '320902332',
        place: 'Тромсьо',
        address: 'Kvaløyvegen 332, 9016 Tromsø',
      }),
    )
    expect(dto.place).toBe('Тромсьо')
    expect(dto.address).toBe('Kvaløyvegen 332, 9016 Tromsø')
  })

  it('is null for an abroad section without an address', () => {
    const dto = SectionDto.fromEntity(
      section({ id: '320010003', place: 'Посолство', address: null }),
      ['read', 'get'],
    )
    expect(dto.address).toBeNull()
  })

  it('falls back to place for a domestic section', () => {
    const dto = SectionDto.fromEntity(
      section({ id: '234615001', place: 'жк Младост 1', address: null }),
    )
    expect(dto.address).toBe('жк Младост 1')
  })
})
