import { parse } from 'csv-parse/sync'
import { ELECTION_REGION_ABROAD } from '../sections.constants'

/** One domestic section from the CIK register of section addresses. */
export interface DomesticSectionInput {
  sectionId: string
  electionRegionCode: string
  municipalityCode: string
  municipalityName: string
  cityRegionCode: string
  cityRegionName: string
  sectionCode: string
  /** EKATTE code of the settlement */
  townCode: number
  townName: string
  place: string
  votersCount: number | null
}

export class DomesticSectionsInputError extends Error {
  constructor(readonly errors: string[]) {
    super(`Invalid domestic sections input:\n${errors.slice(0, 20).join('\n')}`)
    this.name = 'DomesticSectionsInputError'
  }
}

const COLUMNS = [
  'section_id',
  'election_region_code',
  'municipality_code',
  'municipality_name',
  'city_region_code',
  'city_region_name',
  'section_code',
  'town_code',
  'town_name',
  'place',
  'voters_count',
] as const

type Row = Record<(typeof COLUMNS)[number], string>

/**
 * Parse the CSV written by scripts/sections-preprocess/build_domestic_sections_csv.py.
 * Every row is checked: a 9-digit domestic id that agrees with its МИР, municipality,
 * district and section columns, a settlement code and name. Abroad ids are refused.
 */
export function parseDomesticSectionsCsv(
  content: string | Buffer,
): DomesticSectionInput[] {
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Row[]
  const errors: string[] = []
  if (rows.length > 0) {
    const missing = COLUMNS.filter((c) => !(c in rows[0]))
    if (missing.length > 0) {
      throw new DomesticSectionsInputError([
        `Missing columns: ${missing.join(', ')}`,
      ])
    }
  }
  const seen = new Set<string>()
  const out: DomesticSectionInput[] = []
  rows.forEach((row, index) => {
    const line = index + 2
    const id = (row.section_id ?? '').trim()
    const er = (row.election_region_code ?? '').trim()
    const municipality = (row.municipality_code ?? '').trim()
    const district = (row.city_region_code ?? '').trim() || '00'
    const code = (row.section_code ?? '').trim()
    const townCode = parseInt((row.town_code ?? '').trim(), 10)
    const townName = (row.town_name ?? '').trim()
    if (!/^\d{9}$/.test(id)) {
      errors.push(`line ${line}: section id "${id}" is not 9 digits`)
      return
    }
    if (id.startsWith(ELECTION_REGION_ABROAD)) {
      errors.push(`line ${line}: ${id} is an abroad section`)
      return
    }
    if (`${er}${municipality}${district}${code}` !== id) {
      errors.push(
        `line ${line}: ${id} does not match its МИР/municipality/district/section columns`,
      )
      return
    }
    if (!Number.isInteger(townCode) || townCode <= 0 || !townName) {
      errors.push(`line ${line}: ${id} has no settlement code or name`)
      return
    }
    if (seen.has(id)) {
      errors.push(`line ${line}: duplicate section ${id}`)
      return
    }
    seen.add(id)
    const voters = parseInt((row.voters_count ?? '').trim(), 10)
    out.push({
      sectionId: id,
      electionRegionCode: er,
      municipalityCode: municipality,
      municipalityName: (row.municipality_name ?? '').trim(),
      cityRegionCode: district,
      cityRegionName: (row.city_region_name ?? '').trim(),
      sectionCode: code,
      townCode,
      townName,
      place: (row.place ?? '').trim(),
      votersCount: Number.isFinite(voters) ? voters : null,
    })
  })
  if (errors.length > 0) {
    throw new DomesticSectionsInputError(errors)
  }
  return out
}
