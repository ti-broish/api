import {
  AbroadAddressesInputError,
  parseAbroadAddressesCsv,
  parseAbroadAddressesJson,
} from './abroad-addresses.parser'

describe('parseAbroadAddressesCsv', () => {
  it('reads the converter output and ignores other columns', () => {
    expect(
      parseAbroadAddressesCsv(
        '\uFEFFsection_id,country,place,address\n' +
          '320902332,Норвегия,Тромсьо,"Kvaløyvegen  332,\n 9016 Tromsø"\n',
      ),
    ).toEqual([
      { sectionId: '320902332', address: 'Kvaløyvegen 332, 9016 Tromsø' },
    ])
  })

  it('accepts the Bulgarian headers', () => {
    expect(
      parseAbroadAddressesCsv('№ на секция,Адрес\n320010003,Moonah Pl 33\n'),
    ).toEqual([{ sectionId: '320010003', address: 'Moonah Pl 33' }])
  })

  it('drops exact repeats and refuses conflicting ones', () => {
    expect(
      parseAbroadAddressesCsv('id,address\n320010003,A\n320010003,A\n'),
    ).toHaveLength(1)
    expect(() =>
      parseAbroadAddressesCsv('id,address\n320010003,A\n320010003,B\n'),
    ).toThrow(AbroadAddressesInputError)
  })

  it('refuses a file without the columns or rows', () => {
    expect(() => parseAbroadAddressesCsv('foo,bar\n1,2\n')).toThrow(
      /header needs/,
    )
    expect(() => parseAbroadAddressesCsv('id,address\n')).toThrow(/no sections/)
  })

  it('refuses domestic ids', () => {
    expect(() =>
      parseAbroadAddressesCsv('id,address\n234615001,ул. Шипка 1\n'),
    ).toThrow(/not an abroad section id/)
  })
})

describe('parseAbroadAddressesJson', () => {
  it('takes {sections} or a bare array', () => {
    const expected = [{ sectionId: '320902332', address: 'X 1' }]
    expect(
      parseAbroadAddressesJson({
        sections: [{ id: '320902332', address: 'X 1' }],
      }),
    ).toEqual(expected)
    expect(
      parseAbroadAddressesJson([{ section_id: '320902332', address: 'X 1' }]),
    ).toEqual(expected)
  })

  it('refuses anything else', () => {
    expect(() => parseAbroadAddressesJson({})).toThrow(
      AbroadAddressesInputError,
    )
    expect(() => parseAbroadAddressesJson(undefined)).toThrow(
      AbroadAddressesInputError,
    )
  })
})
