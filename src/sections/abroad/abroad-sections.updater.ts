import { DataSource, EntityManager } from 'typeorm'
import { ELECTION_REGION_ABROAD } from '../sections.constants'
import { AbroadSectionInput } from './abroad-sections.parser'

/** Town codes for abroad towns start here, clear of domestic EKATTE codes. */
export const ABROAD_TOWN_CODE_START = 100000
export const ABROAD_ELECTION_REGION_NAME = 'Извън страната'

/**
 * Columns that point at sections / towns / countries. The live foreign keys are
 * read from pg_constraint as well; this list is a fallback so a referencing
 * column without a FK constraint is still checked before anything is deleted.
 */
const KNOWN_REFERENCES: Record<string, [string, string][]> = {
  sections: [
    ['protocols', 'section_id'],
    ['violations', 'section_id'],
    ['streams', 'section_id'],
    ['stream_chunks', 'section_id'],
    ['checkins', 'section_id'],
    ['people', 'section_id'],
  ],
  towns: [
    ['sections', 'town_id'],
    ['violations', 'town_id'],
    ['city_regions_towns', 'town_id'],
    ['city_regions', 'town_id'],
  ],
  countries: [['towns', 'country_id']],
}

/** Rows in other tables that point at a record, keyed by `table.column`. */
export type References = Record<string, number>

export interface AbroadSectionsUpdateReport {
  dryRun: boolean
  received: number
  sections: {
    created: string[]
    updated: string[]
    unchanged: number
    /** Abroad sections missing from the input and deleted (nothing referenced them) */
    deleted: string[]
    /** Abroad sections missing from the input but kept because rows reference them */
    kept: { id: string; references: References }[]
  }
  countries: {
    created: { code: string; name: string }[]
    renamed: { code: string; from: string; to: string }[]
    deleted: { code: string; name: string }[]
    kept: { code: string; name: string; references: References }[]
  }
  towns: {
    created: { code: number; name: string; country: string }[]
    deleted: { code: number; name: string }[]
    kept: { code: number; name: string; references: References }[]
  }
}

/** The input cannot be applied to the current database (HTTP 409). */
export class AbroadSectionsConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AbroadSectionsConflictError'
  }
}

const ABROAD_ID = new RegExp(`^${ELECTION_REGION_ABROAD}\\d{7}$`)
const quoteIdent = (name: string): string => `"${name.replace(/"/g, '""')}"`

async function referencingColumns(
  manager: EntityManager,
  table: keyof typeof KNOWN_REFERENCES,
): Promise<[string, string][]> {
  const fks: { table_name: string; column_name: string }[] =
    await manager.query(
      `
      select src.relname as table_name, a.attname as column_name
      from pg_constraint c
      join pg_class src on src.oid = c.conrelid
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
      where c.contype = 'f'
        and c.confrelid = to_regclass($1)
        and array_length(c.conkey, 1) = 1
      `,
      [table],
    )
  const candidates = new Map<string, [string, string]>()
  for (const fk of fks) {
    candidates.set(`${fk.table_name}.${fk.column_name}`, [
      fk.table_name,
      fk.column_name,
    ])
  }
  for (const [t, c] of KNOWN_REFERENCES[table]) {
    candidates.set(`${t}.${c}`, [t, c])
  }
  // Only keep columns that exist in this database
  const existing: { table_name: string; column_name: string }[] =
    await manager.query(
      `
      select table_name, column_name
      from information_schema.columns
      where table_schema = current_schema()
        and (table_name || '.' || column_name) = any($1)
      `,
      [Array.from(candidates.keys())],
    )
  return existing.map((r) => [r.table_name, r.column_name])
}

/** For each id, the number of rows in other tables that reference it. */
async function findReferences(
  manager: EntityManager,
  table: keyof typeof KNOWN_REFERENCES,
  ids: (string | number)[],
): Promise<Map<string, References>> {
  const refs = new Map<string, References>()
  if (ids.length === 0) {
    return refs
  }
  for (const [t, c] of await referencingColumns(manager, table)) {
    const rows: { id: string | number; count: string }[] = await manager.query(
      `select ${quoteIdent(c)} as id, count(*) as count
       from ${quoteIdent(t)}
       where ${quoteIdent(c)} = any($1)
       group by ${quoteIdent(c)}`,
      [ids],
    )
    for (const row of rows) {
      const key = String(row.id).trim()
      const entry = refs.get(key) ?? {}
      entry[`${t}.${c}`] = parseInt(row.count, 10)
      refs.set(key, entry)
    }
  }
  return refs
}

const townKey = (countryId: number, name: string): string =>
  `${countryId}|${name.trim().toLowerCase()}`

/**
 * Make the abroad part of the database (election region 32) match `input`.
 * Domestic sections, towns and countries are never selected for writes:
 * every write is scoped to `sections.id like '32%'` or to countries with
 * `is_abroad = true`.
 *
 * Must run inside a transaction; use `updateAbroadSections()` for that.
 */
export async function applyAbroadSections(
  manager: EntityManager,
  input: AbroadSectionInput[],
): Promise<AbroadSectionsUpdateReport> {
  if (input.length === 0) {
    throw new AbroadSectionsConflictError(
      'Refusing to apply an empty list: it would delete every abroad section',
    )
  }
  for (const s of input) {
    if (!ABROAD_ID.test(s.sectionId)) {
      throw new AbroadSectionsConflictError(
        `Section ${s.sectionId} is not an abroad section`,
      )
    }
  }

  const report: AbroadSectionsUpdateReport = {
    dryRun: false,
    received: input.length,
    sections: { created: [], updated: [], unchanged: 0, deleted: [], kept: [] },
    countries: { created: [], renamed: [], deleted: [], kept: [] },
    towns: { created: [], deleted: [], kept: [] },
  }

  // One import at a time
  await manager.query(
    `select pg_advisory_xact_lock(hashtext('ti-broish:update-abroad-sections'))`,
  )

  // --- Election region 32 ---
  let [electionRegion]: { id: number }[] = await manager.query(
    `select id from election_regions where code = $1`,
    [ELECTION_REGION_ABROAD],
  )
  if (!electionRegion) {
    ;[electionRegion] = await manager.query(
      `insert into election_regions (code, name, is_abroad) values ($1, $2, true) returning id`,
      [ELECTION_REGION_ABROAD, ABROAD_ELECTION_REGION_NAME],
    )
  }

  // --- Countries: create or reuse by code, rename when the sheet differs ---
  const wantedCountries = new Map<string, string>()
  for (const s of input) {
    wantedCountries.set(s.countryCode, s.countryName)
  }
  const existingCountries: {
    id: number
    code: string
    name: string
    is_abroad: boolean
  }[] = await manager.query(`select id, code, name, is_abroad from countries`)
  const countryByCode = new Map(existingCountries.map((c) => [c.code, c]))
  const countryCodeByName = new Map(
    existingCountries.map((c) => [c.name.trim().toLowerCase(), c.code]),
  )
  for (const [code, name] of wantedCountries) {
    const existing = countryByCode.get(code)
    if (existing && !existing.is_abroad) {
      throw new AbroadSectionsConflictError(
        `Country code ${code} belongs to domestic country "${existing.name}"`,
      )
    }
    const nameOwner = countryCodeByName.get(name.toLowerCase())
    if (nameOwner !== undefined && nameOwner !== code) {
      throw new AbroadSectionsConflictError(
        `Country name "${name}" (code ${code}) is already used by country code ${nameOwner}`,
      )
    }
  }
  const countryIdByCode = new Map<string, number>()
  for (const [code, name] of wantedCountries) {
    const existing = countryByCode.get(code)
    if (existing) {
      countryIdByCode.set(code, existing.id)
      if (existing.name !== name) {
        await manager.query(`update countries set name = $1 where id = $2`, [
          name,
          existing.id,
        ])
        report.countries.renamed.push({ code, from: existing.name, to: name })
      }
    } else {
      const [created]: { id: number }[] = await manager.query(
        `insert into countries (code, name, is_abroad) values ($1, $2, true) returning id`,
        [code, name],
      )
      countryIdByCode.set(code, created.id)
      report.countries.created.push({ code, name })
    }
  }

  // --- Towns: reuse by (country, name), otherwise create with a new code ---
  const countryIds = Array.from(countryIdByCode.values())
  const existingTowns: {
    id: number
    code: number
    country_id: number
    name: string
  }[] = await manager.query(
    `select id, code, country_id, name from towns
       where country_id = any($1) and municipality_id is null
       order by id`,
    [countryIds],
  )
  const townIdByKey = new Map<string, number>()
  for (const t of existingTowns) {
    const key = townKey(t.country_id, t.name)
    if (!townIdByKey.has(key)) {
      townIdByKey.set(key, t.id)
    }
  }
  const [{ next_code: nextCodeRaw }]: { next_code: string }[] =
    await manager.query(
      `select greatest(coalesce(max(code), 0) + 1, $1) as next_code from towns`,
      [ABROAD_TOWN_CODE_START],
    )
  let nextTownCode = parseInt(nextCodeRaw, 10)
  const sortedInput = [...input].sort((a, b) =>
    a.sectionId.localeCompare(b.sectionId),
  )
  const townIdBySection = new Map<string, number>()
  for (const s of sortedInput) {
    const countryId = countryIdByCode.get(s.countryCode)
    const key = townKey(countryId, s.townName)
    let townId = townIdByKey.get(key)
    if (townId === undefined) {
      const [created]: { id: number }[] = await manager.query(
        `insert into towns (name, code, country_id, municipality_id) values ($1, $2, $3, null) returning id`,
        [s.townName, nextTownCode, countryId],
      )
      townId = created.id
      townIdByKey.set(key, townId)
      report.towns.created.push({
        code: nextTownCode,
        name: s.townName,
        country: s.countryName,
      })
      nextTownCode++
    }
    townIdBySection.set(s.sectionId, townId)
  }

  // --- Sections: upsert ---
  const existingSections: {
    id: string
    election_region_id: number
    town_id: number
    city_region_id: number | null
    code: string
    place: string
    voters_count: number | null
    is_machine: boolean | null
    is_mobile: boolean | null
    is_ship: boolean | null
  }[] = await manager.query(
    `select id, election_region_id, town_id, city_region_id, code, place,
            voters_count, is_machine, is_mobile, is_ship
     from sections where id like $1`,
    [`${ELECTION_REGION_ABROAD}%`],
  )
  const existingById = new Map(existingSections.map((s) => [s.id.trim(), s]))

  for (const s of sortedInput) {
    const values = {
      election_region_id: electionRegion.id,
      town_id: townIdBySection.get(s.sectionId),
      code: s.sectionCode,
      place: s.place,
      voters_count: s.votersCount ?? 0,
      is_machine: s.machinesCount > 0,
    }
    const current = existingById.get(s.sectionId)
    if (!current) {
      await manager.query(
        `insert into sections (id, election_region_id, town_id, city_region_id, code, place,
                               voters_count, is_machine, is_mobile, is_ship, risk_level)
         values ($1, $2, $3, null, $4, $5, $6, $7, false, false, 'low')`,
        [
          s.sectionId,
          values.election_region_id,
          values.town_id,
          values.code,
          values.place,
          values.voters_count,
          values.is_machine,
        ],
      )
      report.sections.created.push(s.sectionId)
      continue
    }
    const unchanged =
      current.election_region_id === values.election_region_id &&
      current.town_id === values.town_id &&
      current.city_region_id === null &&
      current.code.trim() === values.code &&
      current.place === values.place &&
      current.voters_count === values.voters_count &&
      current.is_machine === values.is_machine &&
      current.is_mobile === false &&
      current.is_ship === false
    if (unchanged) {
      report.sections.unchanged++
      continue
    }
    await manager.query(
      `update sections
       set election_region_id = $2, town_id = $3, city_region_id = null, code = $4,
           place = $5, voters_count = $6, is_machine = $7, is_mobile = false, is_ship = false
       where id = $1 and id like '${ELECTION_REGION_ABROAD}%'`,
      [
        s.sectionId,
        values.election_region_id,
        values.town_id,
        values.code,
        values.place,
        values.voters_count,
        values.is_machine,
      ],
    )
    report.sections.updated.push(s.sectionId)
  }

  // --- Abroad sections that are not in the input ---
  const inputIds = new Set(input.map((s) => s.sectionId))
  const missing = Array.from(existingById.keys())
    .filter((id) => !inputIds.has(id))
    .sort()
  const sectionRefs = await findReferences(manager, 'sections', missing)
  const deletable = missing.filter((id) => !sectionRefs.has(id))
  for (const id of missing) {
    if (sectionRefs.has(id)) {
      report.sections.kept.push({ id, references: sectionRefs.get(id) })
    }
  }
  if (deletable.length > 0) {
    await manager.query(
      `delete from sections where id = any($1) and id like '${ELECTION_REGION_ABROAD}%'`,
      [deletable],
    )
  }
  report.sections.deleted = deletable

  // --- Abroad towns left without sections ---
  const emptyTowns: { id: number; code: number; name: string }[] =
    await manager.query(
      `select t.id, t.code, t.name
       from towns t
       join countries c on c.id = t.country_id and c.is_abroad = true
       where t.municipality_id is null
         and not exists (select 1 from sections s where s.town_id = t.id)
       order by t.code`,
    )
  const townRefs = await findReferences(
    manager,
    'towns',
    emptyTowns.map((t) => t.id),
  )
  const deletableTowns = emptyTowns.filter((t) => !townRefs.has(String(t.id)))
  for (const t of emptyTowns) {
    if (townRefs.has(String(t.id))) {
      report.towns.kept.push({
        code: t.code,
        name: t.name,
        references: townRefs.get(String(t.id)),
      })
    }
  }
  if (deletableTowns.length > 0) {
    await manager.query(
      `delete from towns t using countries c
       where t.id = any($1) and c.id = t.country_id and c.is_abroad = true`,
      [deletableTowns.map((t) => t.id)],
    )
  }
  report.towns.deleted = deletableTowns.map(({ code, name }) => ({
    code,
    name,
  }))

  // --- Abroad countries left without towns and not in the input ---
  const emptyCountries: { id: number; code: string; name: string }[] =
    await manager.query(
      `select c.id, c.code, c.name
       from countries c
       where c.is_abroad = true
         and not (c.code = any($1))
         and not exists (select 1 from towns t where t.country_id = c.id)
       order by c.code`,
      [Array.from(wantedCountries.keys())],
    )
  const countryRefs = await findReferences(
    manager,
    'countries',
    emptyCountries.map((c) => c.id),
  )
  const deletableCountries = emptyCountries.filter(
    (c) => !countryRefs.has(String(c.id)),
  )
  for (const c of emptyCountries) {
    if (countryRefs.has(String(c.id))) {
      report.countries.kept.push({
        code: c.code,
        name: c.name,
        references: countryRefs.get(String(c.id)),
      })
    }
  }
  if (deletableCountries.length > 0) {
    await manager.query(
      `delete from countries where id = any($1) and is_abroad = true`,
      [deletableCountries.map((c) => c.id)],
    )
  }
  report.countries.deleted = deletableCountries.map(({ code, name }) => ({
    code,
    name,
  }))

  return report
}

/**
 * Run applyAbroadSections() in its own transaction. With `dryRun` every change
 * is made and then rolled back, so the report shows exactly what would happen.
 */
export async function updateAbroadSections(
  dataSource: DataSource,
  input: AbroadSectionInput[],
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<AbroadSectionsUpdateReport> {
  const queryRunner = dataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()
  try {
    const report = await applyAbroadSections(queryRunner.manager, input)
    report.dryRun = dryRun
    if (dryRun) {
      await queryRunner.rollbackTransaction()
    } else {
      await queryRunner.commitTransaction()
    }
    return report
  } catch (e) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction()
    }
    throw e
  } finally {
    await queryRunner.release()
  }
}
