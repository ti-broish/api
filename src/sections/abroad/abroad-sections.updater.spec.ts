/**
 * Integration test against a real PostgreSQL database with the full schema
 * (all migrations). Skipped unless TEST_DATABASE_URL is set, e.g.:
 *
 *   docker run -d --rm --name ti-broish-test-pg -e POSTGRES_PASSWORD=test \
 *     -e POSTGRES_DB=ti_broish_test -p 55432:5432 postgres:13-alpine
 *   TEST_DATABASE_URL=postgres://postgres:test@localhost:55432/ti_broish_test \
 *     npx jest src/sections/abroad
 *
 * The database is wiped. Its name must contain "test".
 */
import { DataSource } from 'typeorm'
import { normaliseAbroadSections } from './abroad-sections.parser'
import {
  AbroadSectionsConflictError,
  updateAbroadSections,
} from './abroad-sections.updater'

const url = process.env.TEST_DATABASE_URL
const describeDb = url ? describe : describe.skip

const row = (country: string, id: string, label: string) => ({
  Държава: country,
  '№ на секция': id,
  'Секционна избирателна комисия': label,
})

const INPUT = normaliseAbroadSections([
  // Reused id: was Бризбън, now Канбера (Посолство)
  row('Австралия', '320010003', 'Канбера (Посолство)'),
  // New section in an existing town
  row('Австралия', '320012002', 'Бризбън'),
  // Identical to what is in the database
  row('Германия ФР', '320270053', 'Берлин 1 (Посолство)'),
  // New country
  row('Катар', '320880001', 'Доха (Посолство)'),
])

describeDb('updateAbroadSections (PostgreSQL)', () => {
  let ds: DataSource

  const ids = async (sql: string, params: unknown[] = []) =>
    (await ds.query(sql, params)).map((r: { id: string }) => r.id.trim())

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
  }, 60000)

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
        (2, '001', 'Австралия', true),
        (3, '027', 'Германия', true),
        (4, '005', 'Бразилия', true);
      insert into election_regions (id, code, name, is_abroad) values
        (1, '01', 'Благоевград', false),
        (2, '32', 'Извън страната', true);
      insert into municipalities (id, code, name) values (1, '01', 'Банско');
      insert into election_regions_municipalities values (1, 1);
      insert into towns (id, code, name, country_id, municipality_id) values
        (1, 2676, 'гр. Банско', 1, 1),
        (2, 100001, 'Бризбън', 2, null),
        (3, 100002, 'Берлин 1', 3, null),
        (4, 100003, 'Сао Пауло', 4, null),
        (5, 100004, 'Мюнхен', 3, null);
      insert into sections (id, election_region_id, town_id, code, place, voters_count,
                            is_machine, is_mobile, is_ship, risk_level, population) values
        ('010100001', 1, 1, '001', 'СОУ Неофит Рилски', 600, true, false, false, 'high', 42),
        ('320010003', 2, 2, '003', 'Annerley Road', 0, true, false, false, 'low', 7),
        ('320270053', 2, 3, '053', 'Посолство', 0, false, false, false, 'low', 0),
        ('320050001', 2, 4, '001', 'Консулство', 0, false, false, false, 'low', 0),
        ('320010099', 2, 2, '099', 'Голд Коуст', 0, false, false, false, 'low', 0);
      select setval(pg_get_serial_sequence('countries', 'id'), 10);
      select setval(pg_get_serial_sequence('election_regions', 'id'), 10);
      select setval(pg_get_serial_sequence('municipalities', 'id'), 10);
      select setval(pg_get_serial_sequence('towns', 'id'), 10);
      -- 320010099 has a protocol, so it must not be deleted
      insert into protocols (id, origin, status, section_id)
        values ('01HZZZZZZZZZZZZZZZZZZZZZZZ', 'ti-broish', 'received', '320010099');
      -- Мюнхен has no sections but a town-level violation
      insert into violations (id, description, town_id)
        values ('01HYYYYYYYYYYYYYYYYYYYYYYY', 'test', 5);
    `)
  })

  it('upserts abroad sections, handles geo and removes only safe orphans', async () => {
    const domesticBefore = await ds.query(
      `select * from sections where id not like '32%'`,
    )

    const report = await updateAbroadSections(ds, INPUT)

    expect(report.dryRun).toBe(false)
    expect(report.received).toBe(4)
    expect(report.sections.created).toEqual(['320012002', '320880001'])
    expect(report.sections.updated).toEqual(['320010003'])
    expect(report.sections.unchanged).toBe(1)
    expect(report.sections.deleted).toEqual(['320050001'])
    expect(report.sections.kept).toEqual([
      { id: '320010099', references: { 'protocols.section_id': 1 } },
    ])
    expect(report.countries.created).toEqual([{ code: '088', name: 'Катар' }])
    expect(report.countries.renamed).toEqual([
      { code: '027', from: 'Германия', to: 'Германия ФР' },
    ])
    expect(report.countries.deleted).toEqual([
      { code: '005', name: 'Бразилия' },
    ])
    expect(report.towns.created).toEqual([
      { code: 100005, name: 'Канбера', country: 'Австралия' },
      { code: 100006, name: 'Доха', country: 'Катар' },
    ])
    expect(report.towns.deleted).toEqual([{ code: 100003, name: 'Сао Пауло' }])
    expect(report.towns.kept).toEqual([
      { code: 100004, name: 'Мюнхен', references: { 'violations.town_id': 1 } },
    ])

    // Domestic rows are untouched
    expect(
      await ds.query(`select * from sections where id not like '32%'`),
    ).toEqual(domesticBefore)
    expect(
      await ds.query(`select code, name from countries where code = '000'`),
    ).toEqual([{ code: '000', name: 'България' }])

    // Reused id now points at the new place; risk/population are left alone
    const [canberra] = await ds.query(`
      select s.code, s.place, s.voters_count, s.is_machine, s.risk_level, s.population,
             t.name as town, t.code as town_code, c.code as country
      from sections s join towns t on t.id = s.town_id join countries c on c.id = t.country_id
      where s.id = '320010003'`)
    expect(canberra).toEqual({
      code: '003',
      place: 'Посолство',
      voters_count: 0,
      is_machine: false,
      risk_level: 'low',
      population: 7,
      town: 'Канбера',
      town_code: 100005,
      country: '001',
    })

    // The new Бризбън section reuses the existing town
    const [brisbane] = await ds.query(
      `select town_id, place from sections where id = '320012002'`,
    )
    expect(brisbane).toEqual({ town_id: 2, place: 'Бризбън' })

    expect(await ids(`select id from sections order by id`)).toEqual([
      '010100001',
      '320010003',
      '320010099',
      '320012002',
      '320270053',
      '320880001',
    ])
  })

  it('is idempotent', async () => {
    await updateAbroadSections(ds, INPUT)
    const second = await updateAbroadSections(ds, INPUT)
    expect(second.sections).toEqual({
      created: [],
      updated: [],
      unchanged: 4,
      deleted: [],
      kept: [{ id: '320010099', references: { 'protocols.section_id': 1 } }],
    })
    expect(second.countries.created).toEqual([])
    expect(second.countries.renamed).toEqual([])
    expect(second.towns.created).toEqual([])
    expect(second.towns.deleted).toEqual([])
  })

  it('rolls everything back on a dry run', async () => {
    const snapshot = async () => ({
      sections: await ds.query(`select * from sections order by id`),
      towns: await ds.query(`select * from towns order by id`),
      countries: await ds.query(`select * from countries order by id`),
    })
    const before = await snapshot()

    const report = await updateAbroadSections(ds, INPUT, { dryRun: true })

    expect(report.dryRun).toBe(true)
    expect(report.sections.created).toEqual(['320012002', '320880001'])
    expect(report.sections.deleted).toEqual(['320050001'])
    expect(await snapshot()).toEqual(before)
  })

  it('aborts without changes when a country name belongs to another code', async () => {
    const before = await ds.query(`select * from sections order by id`)
    await expect(
      updateAbroadSections(
        ds,
        normaliseAbroadSections([
          row('Австралия', '320990001', 'Сидни'),
          row('Катар', '320880001', 'Доха'),
        ]),
      ),
    ).rejects.toBeInstanceOf(AbroadSectionsConflictError)
    expect(await ds.query(`select * from sections order by id`)).toEqual(before)
  })

  it('refuses an empty list', async () => {
    await expect(updateAbroadSections(ds, [])).rejects.toThrow(/empty list/)
  })
})
