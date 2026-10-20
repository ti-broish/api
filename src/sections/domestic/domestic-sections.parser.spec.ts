import * as fs from 'fs'
import * as path from 'path'
import {
  DomesticSectionsInputError,
  parseDomesticSectionsCsv,
} from './domestic-sections.parser'

const HEADER =
  'section_id,election_region_code,municipality_code,municipality_name,city_region_code,city_region_name,section_code,town_code,town_name,place,voters_count'

describe('domestic sections parser', () => {
  it('maps the columns', () => {
    const sections = parseDomesticSectionsCsv(`\uFEFF${HEADER}
111800077,11,18,Ловеч,00,,077,75112,с. Умаревци,ул Никола Помов-комитата №2 - адм сграда,204
234616057,23,46,Столична,16,Лозенец,057,68134,гр. София,"ДГ 190, ул. ""Проф. Живко Сталев"" №21",
`)
    expect(sections).toEqual([
      {
        sectionId: '111800077',
        electionRegionCode: '11',
        municipalityCode: '18',
        municipalityName: 'Ловеч',
        cityRegionCode: '00',
        cityRegionName: '',
        sectionCode: '077',
        townCode: 75112,
        townName: 'с. Умаревци',
        place: 'ул Никола Помов-комитата №2 - адм сграда',
        votersCount: 204,
      },
      expect.objectContaining({
        sectionId: '234616057',
        cityRegionCode: '16',
        place: 'ДГ 190, ул. "Проф. Живко Сталев" №21',
        votersCount: null,
      }),
    ])
  })

  it('rejects abroad, inconsistent, duplicate and settlement-less rows', () => {
    const parse = () =>
      parseDomesticSectionsCsv(`${HEADER}
320010003,32,00,,00,,003,1,Канбера,Посолство,0
111800077,11,18,Ловеч,00,,078,75112,с. Умаревци,адрес,1
111800070,11,18,Ловеч,00,,070,,,адрес,1
111800071,11,18,Ловеч,00,,071,1,с. Х,адрес,1
111800071,11,18,Ловеч,00,,071,1,с. Х,адрес,1
`)
    expect(parse).toThrow(DomesticSectionsInputError)
    try {
      parse()
    } catch (e) {
      expect((e as DomesticSectionsInputError).errors).toEqual([
        'line 2: 320010003 is an abroad section',
        'line 3: 111800077 does not match its МИР/municipality/district/section columns',
        'line 4: 111800070 has no settlement code or name',
        'line 6: duplicate section 111800071',
      ])
    }
  })

  it('rejects a file without the expected columns', () => {
    expect(() => parseDomesticSectionsCsv('id,place\n111800077,x\n')).toThrow(
      /Missing columns/,
    )
  })

  it('parses the committed CIK register of 25 Oct 2026', () => {
    const file = path.join(
      __dirname,
      '..',
      '..',
      'seeds',
      '2026-10-25',
      'domestic-sections.csv',
    )
    const sections = parseDomesticSectionsCsv(fs.readFileSync(file))
    expect(sections).toHaveLength(11789)
    expect(sections.find((s) => s.sectionId === '111800077')).toMatchObject({
      townCode: 75112,
      townName: 'с. Умаревци',
      place: 'ул Никола Помов-комитата №2 - адм сграда',
    })
    expect(sections.find((s) => s.sectionId === '111800070')).toMatchObject({
      townName: 'с. Славяни',
      place: 'пл Съединение №1 - читалище',
    })
    expect(sections.some((s) => s.sectionId.startsWith('32'))).toBe(false)
  })
})
