import { SECTION_SEGMENT_BREAKDOWN } from './sections-pattern'

describe('SECTION_SEGMENT_BREAKDOWN', () => {
  it.each(['320010003', '320012001', '320291132'])(
    'matches the full abroad section id %s',
    (id) => {
      const groups = SECTION_SEGMENT_BREAKDOWN.exec(id)?.groups
      expect(groups?.abroadRegionCode).toBe('32')
      expect(groups?.countryCode).toBe(id.slice(2, 5))
      expect(groups?.sectionCodeAbroad).toBe(id.slice(6))
    },
  )

  it('still matches abroad region and country segments', () => {
    expect(SECTION_SEGMENT_BREAKDOWN.exec('32')?.groups?.abroadRegionCode).toBe(
      '32',
    )
    expect(SECTION_SEGMENT_BREAKDOWN.exec('32001')?.groups?.countryCode).toBe(
      '001',
    )
  })

  it('still matches domestic segments', () => {
    const groups = SECTION_SEGMENT_BREAKDOWN.exec('010100001')?.groups
    expect(groups?.electionRegionCode).toBe('01')
    expect(groups?.sectionCodeDomestic).toBe('001')
  })
})
