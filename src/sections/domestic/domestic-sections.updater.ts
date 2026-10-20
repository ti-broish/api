import { DataSource, EntityManager } from 'typeorm'
import { COUNTRY_DOMESTIC, ELECTION_REGION_ABROAD } from '../sections.constants'
import { DomesticSectionInput } from './domestic-sections.parser'

/** A mobile ballot box (ПСИК): `is_mobile`, or „подвижна“ in the address. */
const MOBILE_PLACE = /подвижн/i
/** Refuse an input that shares less than this share of ids with the database: it is not the same register. */
export const MIN_OVERLAP = 0.8

/**
 * Columns that point at sections. The live foreign keys are read from pg_constraint too;
 * this list also covers a referencing column that has no FK constraint.
 */
const KNOWN_SECTION_REFERENCES: [string, string][] = [
  ['protocols', 'section_id'],
  ['violations', 'section_id'],
  ['streams', 'section_id'],
  ['stream_chunks', 'section_id'],
  ['checkins', 'section_id'],
  ['people', 'section_id'],
  ['reports', 'section_id'],
]

export type References = Record<string, number>
export type KeepReason = 'referenced' | 'mobile' | 'requested'

export interface DomesticSectionsUpdateReport {
  dryRun: boolean
  received: number
  sections: {
    created: string[]
    updated: { id: string; place?: [string, string]; town?: [number, number] }[]
    unchanged: number
    /** Domestic sections missing from the register and deleted (nothing referenced them) */
    deleted: string[]
    /** Domestic sections missing from the register but kept, with the reason */
    kept: { id: string; reasons: KeepReason[]; references?: References }[]
  }
  towns: { created: { code: number; name: string; municipality: string }[] }
  cityRegions: {
    created: { town: number; code: string; name: string }[]
    linked: { town: number; code: string }[]
  }
}

export interface DomesticSectionsOptions {
  /** Section ids to keep even if they are missing from the register (e.g. referenced by the signup app). */
  keep?: string[]
  /** Minimum share of the database's domestic sections the input must contain (default MIN_OVERLAP). */
  /** Also keep mobile ballot boxes missing from the register (default: delete them like any other). */
  keepMobile?: boolean
  minOverlap?: number
}

/** The input cannot be applied to this database. */
export class DomesticSectionsConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomesticSectionsConflictError'
  }
}

const quoteIdent = (name: string): string => `"${name.replace(/"/g, '""')}"`
const NOT_ABROAD = `id not like '${ELECTION_REGION_ABROAD}%'`

async function sectionReferencingColumns(
  manager: EntityManager,
): Promise<[string, string][]> {
  const fks: { table_name: string; column_name: string }[] =
    await manager.query(
      `select src.relname as table_name, a.attname as column_name
     from pg_constraint c
     join pg_class src on src.oid = c.conrelid
     join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.contype = 'f' and c.confrelid = to_regclass('sections') and array_length(c.conkey, 1) = 1`,
    )
  const candidates = new Map<string, [string, string]>()
  for (const fk of fks)
    candidates.set(`${fk.table_name}.${fk.column_name}`, [
      fk.table_name,
      fk.column_name,
    ])
  for (const [t, c] of KNOWN_SECTION_REFERENCES)
    candidates.set(`${t}.${c}`, [t, c])
  const existing: { table_name: string; column_name: string }[] =
    await manager.query(
      `select table_name, column_name from information_schema.columns
     where table_schema = current_schema() and (table_name || '.' || column_name) = any($1)`,
      [Array.from(candidates.keys())],
    )
  return existing.map((r) => [r.table_name, r.column_name])
}

/** For each section id, the number of rows in other tables that point at it. */
export async function findSectionReferences(
  manager: EntityManager,
  ids: string[],
): Promise<Map<string, References>> {
  const refs = new Map<string, References>()
  if (ids.length === 0) return refs
  for (const [t, c] of await sectionReferencingColumns(manager)) {
    const rows: { id: string; count: string }[] = await manager.query(
      `select ${quoteIdent(c)}::text as id, count(*) as count from ${quoteIdent(
        t,
      )}
       where ${quoteIdent(c)}::text = any($1) group by ${quoteIdent(c)}`,
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

/** Number of domestic sections in the database. */
export async function countDomesticSections(
  manager: EntityManager,
): Promise<number> {
  const [{ count }]: { count: string }[] = await manager.query(
    `select count(*) as count from sections where ${NOT_ABROAD}`,
  )
  return parseInt(count, 10)
}

/**
 * Make the domestic sections match the CIK register `input`:
 * - insert sections that are missing, with the register's settlement (by EKATTE code) and address,
 *   creating the settlement / city district when the database has none;
 * - update the address (and settlement) of sections that differ;
 * - delete domestic sections that are not in the register, unless something references them,
 *   they are in `options.keep`, or (with `options.keepMobile`) they are mobile ballot boxes.
 *   Those are kept and reported. The register lists the election's mobile ballot boxes,
 *   so by default a mobile one missing from it is left over from an earlier election.
 *
 * Abroad (МИР 32) is never selected for writes: every write is scoped to `id not like '32%'`.
 * Voters, machines, risk level and population of existing sections are left alone.
 * Must run inside a transaction; `updateDomesticSections()` opens one.
 */
export async function applyDomesticSections(
  manager: EntityManager,
  input: DomesticSectionInput[],
  options: DomesticSectionsOptions = {},
): Promise<DomesticSectionsUpdateReport> {
  if (input.length === 0) {
    throw new DomesticSectionsConflictError(
      'Refusing to apply an empty register: it would delete every domestic section',
    )
  }
  for (const s of input) {
    if (s.sectionId.startsWith(ELECTION_REGION_ABROAD)) {
      throw new DomesticSectionsConflictError(
        `Section ${s.sectionId} is an abroad section`,
      )
    }
  }
  const report: DomesticSectionsUpdateReport = {
    dryRun: false,
    received: input.length,
    sections: { created: [], updated: [], unchanged: 0, deleted: [], kept: [] },
    towns: { created: [] },
    cityRegions: { created: [], linked: [] },
  }

  await manager.query(
    `select pg_advisory_xact_lock(hashtext('ti-broish:update-domestic-sections'))`,
  )

  const existing: {
    id: string
    place: string
    town_id: number
    town_code: number
    is_mobile: boolean | null
  }[] = await manager.query(
    `select s.id, s.place, s.town_id, t.code as town_code, s.is_mobile
     from sections s join towns t on t.id = s.town_id
     where s.${NOT_ABROAD}`,
  )
  const existingById = new Map(existing.map((s) => [s.id.trim(), s]))
  const inputIds = new Set(input.map((s) => s.sectionId))
  const overlap = existing.filter((s) => inputIds.has(s.id.trim())).length
  if (
    existing.length > 0 &&
    overlap / existing.length < (options.minOverlap ?? MIN_OVERLAP)
  ) {
    throw new DomesticSectionsConflictError(
      `Only ${overlap} of ${existing.length} domestic sections are in the input: it does not look like the same register`,
    )
  }

  // --- Election regions and municipalities (must exist) ---
  const regions: { id: number; code: string }[] = await manager.query(
    `select id, code from election_regions`,
  )
  const regionId = new Map(regions.map((r) => [r.code.trim(), r.id]))
  const municipalities: {
    er: string
    id: number
    code: string
    name: string
  }[] = await manager.query(
    `select er.code as er, m.id, m.code, m.name
     from election_regions_municipalities erm
     join election_regions er on er.id = erm.election_region_id
     join municipalities m on m.id = erm.municipality_id`,
  )
  const municipalityByKey = new Map(
    municipalities.map((m) => [`${m.er.trim()}:${m.code.trim()}`, m]),
  )
  const problems: string[] = []
  for (const s of input) {
    if (!regionId.has(s.electionRegionCode))
      problems.push(
        `${s.sectionId}: no election region ${s.electionRegionCode}`,
      )
    else if (
      !municipalityByKey.has(`${s.electionRegionCode}:${s.municipalityCode}`)
    )
      problems.push(
        `${s.sectionId}: no municipality ${s.municipalityCode} (${s.municipalityName}) in МИР ${s.electionRegionCode}`,
      )
  }
  if (problems.length > 0) {
    throw new DomesticSectionsConflictError(
      `Unknown МИР/municipality:\n${problems.slice(0, 20).join('\n')}`,
    )
  }

  const [country]: { id: number }[] = await manager.query(
    `select id from countries where code = $1`,
    [COUNTRY_DOMESTIC],
  )
  if (!country)
    throw new DomesticSectionsConflictError(
      `No domestic country ${COUNTRY_DOMESTIC}`,
    )

  // --- Settlements by EKATTE code; create the ones the database does not have ---
  const sorted = [...input].sort((a, b) =>
    a.sectionId.localeCompare(b.sectionId),
  )
  const needsTown = sorted.filter((s) => {
    const current = existingById.get(s.sectionId)
    return !current || current.town_code !== s.townCode
  })
  const townCodes = [...new Set(needsTown.map((s) => s.townCode))]
  const towns: { id: number; code: number; country_id: number }[] =
    townCodes.length
      ? await manager.query(
          `select id, code, country_id from towns where code = any($1)`,
          [townCodes],
        )
      : []
  const townIdByCode = new Map<number, number>()
  for (const t of towns) {
    if (t.country_id !== country.id) {
      throw new DomesticSectionsConflictError(
        `Settlement code ${t.code} belongs to a town abroad`,
      )
    }
    townIdByCode.set(t.code, t.id)
  }
  for (const s of needsTown) {
    if (townIdByCode.has(s.townCode)) continue
    const municipality = municipalityByKey.get(
      `${s.electionRegionCode}:${s.municipalityCode}`,
    )
    const [created]: { id: number }[] = await manager.query(
      `insert into towns (name, code, country_id, municipality_id) values ($1, $2, $3, $4) returning id`,
      [s.townName, s.townCode, country.id, municipality.id],
    )
    townIdByCode.set(s.townCode, created.id)
    report.towns.created.push({
      code: s.townCode,
      name: s.townName,
      municipality: municipality.name,
    })
  }

  // --- City districts for the sections that need a settlement ---
  const cityRegionIdFor = async (
    s: DomesticSectionInput,
    townId: number,
  ): Promise<number | null> => {
    if (!s.cityRegionCode || s.cityRegionCode === '00') return null
    const [linked]: { id: number }[] = await manager.query(
      `select cr.id from city_regions cr join city_regions_towns crt on crt.city_region_id = cr.id
       where crt.town_id = $1 and cr.code = $2 order by cr.id limit 1`,
      [townId, s.cityRegionCode],
    )
    if (linked) return linked.id
    let [region]: { id: number }[] = await manager.query(
      `select id from city_regions where code = $1 and lower(name) = lower($2) order by id limit 1`,
      [s.cityRegionCode, s.cityRegionName],
    )
    if (!region) {
      ;[region] = await manager.query(
        `insert into city_regions (code, name) values ($1, $2) returning id`,
        [s.cityRegionCode, s.cityRegionName || s.cityRegionCode],
      )
      report.cityRegions.created.push({
        town: s.townCode,
        code: s.cityRegionCode,
        name: s.cityRegionName,
      })
    }
    await manager.query(
      `insert into city_regions_towns (town_id, city_region_id) values ($1, $2)`,
      [townId, region.id],
    )
    report.cityRegions.linked.push({ town: s.townCode, code: s.cityRegionCode })
    return region.id
  }

  // --- Sections: insert missing, update changed ---
  for (const s of sorted) {
    const current = existingById.get(s.sectionId)
    if (!current) {
      const townId = townIdByCode.get(s.townCode)
      const voters = s.votersCount ?? 0
      await manager.query(
        `insert into sections (id, election_region_id, town_id, city_region_id, code, place,
                               voters_count, is_machine, is_mobile, is_ship, risk_level, population)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, 'low', 0)`,
        [
          s.sectionId,
          regionId.get(s.electionRegionCode),
          townId,
          await cityRegionIdFor(s, townId),
          s.sectionCode,
          s.place,
          voters,
          voters > 299,
          MOBILE_PLACE.test(s.place),
        ],
      )
      report.sections.created.push(s.sectionId)
      continue
    }
    const change: DomesticSectionsUpdateReport['sections']['updated'][number] =
      { id: s.sectionId }
    if (current.place !== s.place) change.place = [current.place, s.place]
    if (current.town_code !== s.townCode)
      change.town = [current.town_code, s.townCode]
    if (!change.place && !change.town) {
      report.sections.unchanged++
      continue
    }
    if (change.town) {
      const townId = townIdByCode.get(s.townCode)
      await manager.query(
        `update sections set place = $2, town_id = $3, city_region_id = $4 where id = $1 and ${NOT_ABROAD}`,
        [s.sectionId, s.place, townId, await cityRegionIdFor(s, townId)],
      )
    } else {
      await manager.query(
        `update sections set place = $2 where id = $1 and ${NOT_ABROAD}`,
        [s.sectionId, s.place],
      )
    }
    report.sections.updated.push(change)
  }

  // --- Domestic sections that are not in the register ---
  const keep = new Set((options.keep ?? []).map((id) => id.trim()))
  const missing = Array.from(existingById.keys())
    .filter((id) => !inputIds.has(id))
    .sort()
  const refs = await findSectionReferences(manager, missing)
  const deletable: string[] = []
  for (const id of missing) {
    const reasons: KeepReason[] = []
    if (refs.has(id)) reasons.push('referenced')
    const current = existingById.get(id)
    if (
      options.keepMobile &&
      (current.is_mobile || MOBILE_PLACE.test(current.place ?? ''))
    )
      reasons.push('mobile')
    if (keep.has(id)) reasons.push('requested')
    if (reasons.length === 0) deletable.push(id)
    else
      report.sections.kept.push(
        refs.has(id)
          ? { id, reasons, references: refs.get(id) }
          : { id, reasons },
      )
  }
  if (deletable.length > 0) {
    await manager.query(
      `delete from sections where id = any($1) and ${NOT_ABROAD}`,
      [deletable],
    )
  }
  report.sections.deleted = deletable
  return report
}

/** Apply the register in one transaction; with `dryRun` everything is rolled back. */
export async function updateDomesticSections(
  dataSource: DataSource,
  input: DomesticSectionInput[],
  options: DomesticSectionsOptions & { dryRun?: boolean } = {},
): Promise<DomesticSectionsUpdateReport> {
  const runner = dataSource.createQueryRunner()
  await runner.connect()
  await runner.startTransaction()
  try {
    const report = await applyDomesticSections(runner.manager, input, options)
    report.dryRun = options.dryRun === true
    if (report.dryRun) await runner.rollbackTransaction()
    else await runner.commitTransaction()
    return report
  } catch (error) {
    await runner.rollbackTransaction()
    throw error
  } finally {
    await runner.release()
  }
}

/** Short summary for logs. */
export function summarizeDomesticSections(
  report: DomesticSectionsUpdateReport,
) {
  return {
    dryRun: report.dryRun,
    received: report.received,
    sections: {
      created: report.sections.created,
      updated: report.sections.updated,
      unchanged: report.sections.unchanged,
      deleted: report.sections.deleted.length,
      kept: report.sections.kept,
    },
    towns: report.towns,
    cityRegions: report.cityRegions,
  }
}
