import { sectionAddress } from './section-address'

describe('sectionAddress', () => {
  it('uses the address column when it is set', () => {
    expect(
      sectionAddress({
        id: '320902332',
        place: 'Тромсьо',
        address: ' Kvaløyvegen 332, 9016 Tromsø ',
      }),
    ).toBe('Kvaløyvegen 332, 9016 Tromsø')
    expect(
      sectionAddress({
        id: '234615001',
        place: 'жк Младост 1',
        address: 'ул. Шипка 1',
      }),
    ).toBe('ул. Шипка 1')
  })

  it('falls back to place for a domestic section', () => {
    expect(
      sectionAddress({ id: '234615001', place: 'жк Младост 1', address: null }),
    ).toBe('жк Младост 1')
    expect(
      sectionAddress({ id: '234615001', place: 'жк Младост 1', address: '  ' }),
    ).toBe('жк Младост 1')
  })

  it('never uses the committee name of an abroad section as its address', () => {
    expect(
      sectionAddress({ id: '320902332', place: 'Тромсьо', address: null }),
    ).toBeNull()
    expect(sectionAddress({ id: '320010003', place: 'Посолство' })).toBeNull()
  })

  it('is null when nothing is known', () => {
    expect(sectionAddress({ id: '234615001', place: '' })).toBeNull()
    expect(sectionAddress({})).toBeNull()
  })
})
