/**
 * Integration test against a real PostgreSQL database with the full schema
 * (all migrations). Skipped unless TEST_DATABASE_URL is set, e.g.:
 *
 *   docker run -d --rm --name ti-broish-test-pg -e POSTGRES_PASSWORD=test \
 *     -e POSTGRES_DB=ti_broish_test -p 55432:5432 postgres:13-alpine
 *   TEST_DATABASE_URL=postgres://postgres:test@localhost:55432/ti_broish_test \
 *     npx jest src/sections/domestic
 *
 * The database is wiped. Its name must contain "test".
 */
import { DataSource } from 'typeorm'
import { parseDomesticSectionsCsv } from './domestic-sections.parser'
import {
  DomesticSectionsConflictError,
  updateDomesticSections,
} from './domestic-sections.updater'

const url = process.env.TEST_DATABASE_URL
const describeDb = url ? describe : describe.skip

const HEADER =
  'section_id,election_region_code,municipality_code,municipality_name,city_region_code,city_region_name,section_code,town_code,town_name,place,voters_count'

const INPUT = parseDomesticSectionsCsv(`${HEADER}
111800001,11,18,Ловеч,00,,001,43952,гр. Ловеч,ул Търговска № 1,500
111800070,11,18,Ловеч,00,,070,67060,с. Славяни,пл Съединение №1 - читалище,432
111800077,11,18,Ловеч,00,,077,75112,с. Умаревци,ул Никола Помов-комитата №2 - адм сграда,204
234616057,23,46,Столична,16,Лозенец,057,68134,гр. София,"ДГ 190, ул. ""Проф. Живко Сталев"" №21",
`)

describeDb('updateDomesticSections (PostgreSQL)', () => {
  let ds: DataSource

  const ids = async (sql: string, params: unknown[] = []) =>
    (await ds.query(sql, params)).map((r: { id: string }) => r.id.trim()).sort()

  beforeAll(async () => {
    if (!/test/i.test(new URL(url).pathname)) {
      throw new Error('TEST_DATABASE_URL must point at a database named *test*')
    }
    ds = new DataSource({
      type: 'postgres',
      url,
      migrations: [__dirname + '/../../migrations/*.ts'],
    })
    await ds.initialize()
    await ds.query('drop schema public cascade; create schema public;')
    await ds.runMigrations()
  }, 120000)

  afterAll(async () => {
    await ds?.destroy()
  })

  beforeEach(async () => {
    await ds.query(`
      truncate protocols, violations, checkins, sections, city_regions_towns,
        city_regions, towns, election_regions_municipalities, municipalities,
        election_regions, countries restart identity cascade;

      insert into countries (id, code, name, is_abroad) values
        (1, '000', 'България', false),
        (2, '001', 'Австралия', true);
      insert into election_regions (id, code, name, is_abroad) values
        (1, '11', 'Ловеч', false),
        (2, '23', 'София 23 МИР', false),
        (3, '32', 'Извън страната', true);
      insert into municipalities (id, code, name) values (1, '18', 'Ловеч'), (2, '46', 'Столична');
      insert into election_regions_municipalities values (1, 1), (2, 2);
      insert into towns (id, code, name, country_id, municipality_id) values
        (1, 43952, 'гр. Ловеч', 1, 1),
        (2, 67060, 'с. Славяни', 1, 1),
        (3, 68134, 'гр.София', 1, 2),
        (4, 100001, 'Канбера', 2, null);
      insert into city_regions (id, code, name) values (1, '16', 'Лозенец');
      insert into city_regions_towns (town_id, city_region_id) values (3, 1);
      insert into sections (id, election_region_id, town_id, city_region_id, code, place, voters_count,
                            is_machine, is_mobile, is_ship, risk_level, population) values
        ('111800001', 1, 1, null, '001', 'ул Търговска № 1', 600, true, false, false, 'high', 42),
        -- Old address: must be updated
        ('111800070', 1, 2, null, '070', 'ул Съединение № 1 - читалище', 400, true, false, false, 'low', 0),
        -- Not in the register any more: deleted
        ('111800046', 1, 2, null, '046', 'стара секция', 10, false, false, false, 'low', 0),
        -- Not in the register, but has a protocol: kept
        ('111800047', 1, 1, null, '047', 'с протокол', 10, false, false, false, 'low', 0),
        -- Not in the register, but a mobile ballot box: kept
        ('111800090', 1, 1, null, '090', 'Подвижна избирателна кутия', 0, false, true, false, 'low', 0),
        -- Not in the register, but requested to keep: kept
        ('111800091', 1, 1, null, '091', 'приоритетна', 0, false, false, false, 'low', 0),
        -- Abroad: never touched
        ('320010003', 3, 4, null, '003', 'Посолство', 0, false, false, false, 'low', 0);
      select setval(pg_get_serial_sequence('towns', 'id'), 10);
      select setval(pg_get_serial_sequence('city_regions', 'id'), 10);
      insert into protocols (id, origin, status, section_id)
        values ('01HZZZZZZZZZZZZZZZZZZZZZZZ', 'ti-broish', 'received', '111800047');
    `)
  })

  it('adds missing sections and settlements, updates addresses, removes only safe orphans', async () => {
    const report = await updateDomesticSections(ds, INPUT, {
      keep: ['111800091'],
      minOverlap: 0,
    })

    expect(report.sections.created).toEqual(['111800077', '234616057'])
    expect(report.sections.updated).toEqual([
      {
        id: '111800070',
        place: ['ул Съединение № 1 - читалище', 'пл Съединение №1 - читалище'],
      },
    ])
    expect(report.sections.unchanged).toBe(1)
    expect(report.sections.deleted).toEqual(['111800046'])
    expect(report.sections.kept).toEqual([
      {
        id: '111800047',
        reasons: ['referenced'],
        references: { 'protocols.section_id': 1 },
      },
      { id: '111800090', reasons: ['mobile'] },
      { id: '111800091', reasons: ['requested'] },
    ])
    expect(report.towns.created).toEqual([
      { code: 75112, name: 'с. Умаревци', municipality: 'Ловеч' },
    ])
    expect(report.cityRegions).toEqual({ created: [], linked: [] })

    const [s077] = await ds.query(
      `select s.place, s.voters_count, s.is_machine, s.is_mobile, s.code, t.name as town, t.code as town_code,
              m.code as municipality, er.code as er
       from sections s join towns t on t.id = s.town_id join municipalities m on m.id = t.municipality_id
       join election_regions er on er.id = s.election_region_id where s.id = '111800077'`,
    )
    expect(s077).toEqual({
      place: 'ул Никола Помов-комитата №2 - адм сграда',
      voters_count: 204,
      is_machine: false,
      is_mobile: false,
      code: '077',
      town: 'с. Умаревци',
      town_code: 75112,
      municipality: '18',
      er: '11',
    })
    const [s057] = await ds.query(
      `select town_id, city_region_id, voters_count from sections where id = '234616057'`,
    )
    expect(s057).toEqual({ town_id: 3, city_region_id: 1, voters_count: 0 })
    // Voters, machines, risk and population of existing sections stay as they were
    const [s001] = await ds.query(
      `select voters_count, risk_level, population from sections where id = '111800001'`,
    )
    expect(s001).toEqual({
      voters_count: 600,
      risk_level: 'high',
      population: 42,
    })

    expect(await ids(`select id from sections where id like '32%'`)).toEqual([
      '320010003',
    ])
    expect(await ids(`select id from sections`)).toEqual([
      '111800001',
      '111800047',
      '111800070',
      '111800077',
      '111800090',
      '111800091',
      '234616057',
      '320010003',
    ])

    // Re-running is a no-op
    const again = await updateDomesticSections(ds, INPUT, {
      keep: ['111800091'],
      minOverlap: 0,
    })
    expect(again.sections).toMatchObject({
      created: [],
      updated: [],
      unchanged: 4,
      deleted: [],
    })
    expect(again.towns.created).toEqual([])
  })

  it('creates a city district link when a settlement lacks it', async () => {
    await ds.query(`delete from city_regions_towns`)
    const report = await updateDomesticSections(ds, INPUT, {
      keep: ['111800091'],
      minOverlap: 0,
    })
    expect(report.cityRegions).toEqual({
      created: [],
      linked: [{ town: 68134, code: '16' }],
    })
  })

  it('changes nothing on a dry run', async () => {
    const before = await ids(`select id from sections`)
    const report = await updateDomesticSections(ds, INPUT, {
      dryRun: true,
      minOverlap: 0,
    })
    expect(report.dryRun).toBe(true)
    expect(report.sections.created).toHaveLength(2)
    expect(await ids(`select id from sections`)).toEqual(before)
    expect(await ds.query(`select id from towns where code = 75112`)).toEqual(
      [],
    )
  })

  it('refuses a register that does not overlap the database', async () => {
    const other = parseDomesticSectionsCsv(`${HEADER}
111800077,11,18,Ловеч,00,,077,75112,с. Умаревци,адрес,1
`)
    await expect(updateDomesticSections(ds, other)).rejects.toThrow(
      DomesticSectionsConflictError,
    )
    expect(await ids(`select id from sections where id = '111800046'`)).toEqual(
      ['111800046'],
    )
  })

  it('refuses an unknown municipality', async () => {
    const bad = parseDomesticSectionsCsv(`${HEADER}
111800001,11,18,Ловеч,00,,001,43952,гр. Ловеч,ул Търговска № 1,500
111800070,11,18,Ловеч,00,,070,67060,с. Славяни,пл Съединение №1 - читалище,432
111800047,11,18,Ловеч,00,,047,43952,гр. Ловеч,с протокол,1
111800090,11,18,Ловеч,00,,090,43952,гр. Ловеч,Подвижна избирателна кутия,1
111800091,11,18,Ловеч,00,,091,43952,гр. Ловеч,приоритетна,1
111800046,11,18,Ловеч,00,,046,67060,с. Славяни,стара секция,1
119900001,11,99,Няма,00,,001,1,с. Няма,адрес,1
`)
    await expect(
      updateDomesticSections(ds, bad, { minOverlap: 0 }),
    ).rejects.toThrow(/no municipality 99/)
  })
})
