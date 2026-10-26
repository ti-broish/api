/**
 * Integration test against a real PostgreSQL database with the full schema
 * (all migrations). Skipped unless TEST_DATABASE_URL is set, e.g.:
 *
 *   docker run -d --rm --name ti-broish-test-pg -e POSTGRES_PASSWORD=test \
 *     -e POSTGRES_DB=ti_broish_test -p 55432:5432 postgres:13-alpine
 *   TEST_DATABASE_URL=postgres://postgres:test@localhost:55432/ti_broish_test \
 *     npx jest src/sections/abroad-addresses
 *
 * The database is wiped. Its name must contain "test".
 */
import { DataSource } from 'typeorm'
import { listAbroadSections } from './abroad-sections.list'
import { updateAbroadAddresses } from './abroad-addresses.updater'

const url = process.env.TEST_DATABASE_URL
const describeDb = url ? describe : describe.skip

describeDb('abroad addresses (PostgreSQL)', () => {
  let ds: DataSource

  const sections = async () =>
    (
      await ds.query(
        'select trim(id) as id, place, address, voters_count from sections order by id',
      )
    ).map((r) => ({ ...r }))

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
        (2, '001', 'Австралия', true),
        (3, '090', 'Норвегия', true);
      insert into election_regions (id, code, name, is_abroad) values
        (1, '11', 'Ловеч', false),
        (2, '32', 'Извън страната', true);
      insert into municipalities (id, code, name) values (1, '18', 'Ловеч');
      insert into election_regions_municipalities values (1, 1);
      insert into towns (id, code, name, country_id, municipality_id) values
        (1, 43952, 'гр. Ловеч', 1, 1),
        (2, 100001, 'Канбера', 2, null),
        (3, 100320, 'Тромсьо', 3, null);
      insert into sections (id, election_region_id, town_id, city_region_id, code, place, voters_count,
                            is_machine, is_mobile, is_ship, risk_level, population, address) values
        ('111800001', 1, 1, null, '001', 'ул Търговска № 1', 600, true, false, false, 'low', 0, null),
        ('320010003', 2, 2, null, '003', 'Посолство', 0, false, false, false, 'low', 0, 'Moonah Pl 33'),
        ('320902332', 2, 3, null, '332', 'Тромсьо', 0, false, false, false, 'low', 0, 'Stakkevollvegen 1');
    `)
  })

  it('updates only the addresses of existing abroad sections', async () => {
    const before = await sections()
    const report = await updateAbroadAddresses(ds, [
      { sectionId: '320902332', address: 'Kvaløyvegen 332, 9016 Tromsø' },
      { sectionId: '320010003', address: 'Moonah Pl 33' },
      { sectionId: '320999999', address: 'Nowhere 1' },
    ])
    expect(report).toEqual({
      dryRun: false,
      received: 3,
      updated: [
        {
          id: '320902332',
          from: 'Stakkevollvegen 1',
          to: 'Kvaløyvegen 332, 9016 Tromsø',
        },
      ],
      unchanged: 1,
      unknown: ['320999999'],
    })
    expect(await sections()).toEqual(
      before.map((s) =>
        s.id === '320902332'
          ? { ...s, address: 'Kvaløyvegen 332, 9016 Tromsø' }
          : s,
      ),
    )
  })

  it('writes nothing on a dry run', async () => {
    const before = await sections()
    const report = await updateAbroadAddresses(
      ds,
      [{ sectionId: '320902332', address: 'Kvaløyvegen 332, 9016 Tromsø' }],
      { dryRun: true },
    )
    expect(report.dryRun).toBe(true)
    expect(report.updated).toHaveLength(1)
    expect(await sections()).toEqual(before)
  })

  it('lists abroad sections with town, country and address', async () => {
    await ds.query(`update sections set address = null where id = '320010003'`)
    expect(await listAbroadSections(ds)).toEqual([
      {
        id: '320010003',
        code: '003',
        place: 'Посолство',
        address: null,
        town: { id: 100001, name: 'Канбера' },
        country: { code: '001', name: 'Австралия' },
      },
      {
        id: '320902332',
        code: '332',
        place: 'Тромсьо',
        address: 'Stakkevollvegen 1',
        town: { id: 100320, name: 'Тромсьо' },
        country: { code: '090', name: 'Норвегия' },
      },
    ])
  })
})
