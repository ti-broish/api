import {
  AbroadSectionsInputError,
  cleanCountryName,
  normaliseAbroadSections,
  parseAbroadSectionsCsv,
  splitSicLabel,
} from './abroad-sections.parser'

// Rows copied from sections_abroad_2026-10-25.csv (the CIK sheet export)
const SHEET = `\uFEFFДържава,№ на секция,Секционна избирателна комисия
Австралия,320012001,Аделаида
Австралия,320010003,Канбера (Посолство)
Австрия,320020015,Виена (Посолски комплекс) - ПК Нашмаркт
Австрия,320020017,"Виена (ПП на РБ към ООН, ОССЕ и други международни организации)"
Австрия,320022022,Леобен*
Германия ФР,320270052,Берлин 3 (Посолство)
Гърция,320291132,"остров Крит, Ираклио"
,320291135,"остров Крит, Ретимно"
Общо: 8,,
`

describe('abroad sections parser', () => {
  it('maps the CIK sheet columns', async () => {
    const sections = await parseAbroadSectionsCsv(SHEET)
    expect(sections).toHaveLength(8)
    expect(sections[0]).toEqual({
      sectionId: '320012001',
      sectionCode: '001',
      countryCode: '001',
      countryName: 'Австралия',
      townName: 'Аделаида',
      place: 'Аделаида',
      votersCount: null,
      machinesCount: 0,
    })
    expect(sections[1]).toMatchObject({
      sectionId: '320010003',
      sectionCode: '003',
      townName: 'Канбера',
      place: 'Посолство',
    })
    expect(sections[2]).toMatchObject({
      countryCode: '002',
      townName: 'Виена',
      place: 'Посолски комплекс ПК Нашмаркт',
    })
    expect(sections[3]).toMatchObject({
      townName: 'Виена',
      place: 'ПП на РБ към ООН, ОССЕ и други международни организации',
    })
    expect(sections[4]).toMatchObject({ townName: 'Леобен', place: 'Леобен' })
    expect(sections[5]).toMatchObject({
      countryCode: '027',
      countryName: 'Германия ФР',
      townName: 'Берлин 3',
      place: 'Посолство',
    })
    // A blank country repeats the previous one
    expect(sections[7]).toMatchObject({
      countryCode: '029',
      countryName: 'Гърция',
      townName: 'остров Крит, Ретимно',
    })
  })

  it('reads optional voters and machines columns', async () => {
    const sections = await parseAbroadSectionsCsv(
      'Държава,№ на секция,Секционна избирателна комисия,Избиратели,Машини\n' +
        'Австралия,320012001,Аделаида,120,1\n' +
        'Австралия,320012002,Бризбън,,\n',
    )
    expect(sections[0]).toMatchObject({ votersCount: 120, machinesCount: 1 })
    expect(sections[1]).toMatchObject({ votersCount: null, machinesCount: 0 })
  })

  it('accepts English keys in JSON rows', () => {
    const sections = normaliseAbroadSections([
      { country: 'Австралия', section_id: '320012001', label: 'Аделаида' },
    ])
    expect(sections[0].sectionId).toBe('320012001')
  })

  it('rejects domestic, malformed and duplicate ids and lists every error', () => {
    expect.assertions(5)
    try {
      normaliseAbroadSections([
        { Държава: 'Австралия', '№ на секция': '010100001', label: 'x' },
        { Държава: 'Австралия', '№ на секция': '32001200', label: 'x' },
        { Държава: 'Австралия', '№ на секция': '320012001', label: 'Аделаида' },
        { Държава: 'Австралия', '№ на секция': '320012001', label: 'Аделаида' },
        { Държава: 'Австралия', '№ на секция': '320012002', label: '' },
      ])
    } catch (e) {
      expect(e).toBeInstanceOf(AbroadSectionsInputError)
      const { errors } = e as AbroadSectionsInputError
      expect(errors[0]).toMatch(/010100001.*abroad id/)
      expect(errors[1]).toMatch(/32001200/)
      expect(errors[2]).toMatch(/duplicate section id 320012001/)
      expect(errors[3]).toMatch(/missing SIC label/)
    }
  })

  it('rejects one country code with two names', () => {
    expect(() =>
      normaliseAbroadSections([
        { Държава: 'Германия', '№ на секция': '320270052', label: 'Берлин' },
        { Държава: 'Германия ФР', '№ на секция': '320270053', label: 'Бон' },
      ]),
    ).toThrow(/country code 027/)
  })

  it('rejects an empty list', async () => {
    await expect(
      parseAbroadSectionsCsv(
        'Държава,№ на секция,Секционна избирателна комисия\n',
      ),
    ).rejects.toThrow(/no abroad sections/)
  })

  it('cleans country names and SIC labels like the seed script', () => {
    expect(cleanCountryName('Турция *')).toBe('Турция')
    expect(cleanCountryName('Кипър (Република)')).toBe('Кипър')
    expect(splitSicLabel('Анкара (Посолство) 1')).toEqual({
      townName: 'Анкара',
      place: 'Посолство 1',
    })
    expect(splitSicLabel('Баку (Посолство) *')).toEqual({
      townName: 'Баку',
      place: 'Посолство',
    })
  })
})
