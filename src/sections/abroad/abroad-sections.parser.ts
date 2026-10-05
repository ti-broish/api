import { parse } from 'csv-parse'
import { Readable } from 'stream'
import { ELECTION_REGION_ABROAD } from '../sections.constants'

/**
 * One abroad section, normalised from the CIK sheet columns
 * (Държава, № на секция, Секционна избирателна комисия).
 */
export interface AbroadSectionInput {
  /** 9 digits, `32` + country code (3) + 1 digit + section code (3) */
  sectionId: string
  /** Last 3 digits of the section id */
  sectionCode: string
  /** Digits 3-5 of the section id */
  countryCode: string
  countryName: string
  /** City part of the SIC label, e.g. `Лондон` from `Лондон (Посолство 1)` */
  townName: string
  /** Tag part of the SIC label, or the whole label when there is no `(…)` */
  place: string
  votersCount: number | null
  machinesCount: number
}

/** A raw row keyed by column header (CSV) or property name (JSON). */
export type AbroadSectionRawRow = Record<string, unknown>

export class AbroadSectionsInputError extends RangeError {
  constructor(public readonly errors: string[]) {
    super(
      `Invalid abroad sections input (${errors.length} error${
        errors.length === 1 ? '' : 's'
      }):\n${errors.slice(0, 50).join('\n')}${
        errors.length > 50 ? `\n… and ${errors.length - 50} more` : ''
      }`,
    )
    this.name = 'AbroadSectionsInputError'
  }
}

const COLUMN_ALIASES = {
  sectionId: ['№ на секция', 'section_id', 'sectionId', 'section', 'id'],
  country: ['Държава', 'country_name', 'countryName', 'country'],
  label: ['Секционна избирателна комисия', 'label', 'sik', 'sic'],
  voters: ['Избиратели', 'voters_count', 'votersCount', 'voters'],
  machines: ['Машини', 'machines_count', 'machinesCount', 'machines'],
} as const

type Column = keyof typeof COLUMN_ALIASES

const normaliseKey = (key: string): string =>
  key
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()

const ALIAS_LOOKUP: Map<string, Column> = new Map(
  (Object.entries(COLUMN_ALIASES) as [Column, readonly string[]][]).flatMap(
    ([column, aliases]) =>
      aliases.map((alias) => [normaliseKey(alias), column] as [string, Column]),
  ),
)

const pick = (row: AbroadSectionRawRow): Partial<Record<Column, string>> => {
  const out: Partial<Record<Column, string>> = {}
  for (const [key, value] of Object.entries(row)) {
    const column = ALIAS_LOOKUP.get(normaliseKey(key))
    if (!column || out[column] !== undefined) {
      continue
    }
    out[column] = value === null || value === undefined ? '' : String(value)
  }
  return out
}

const clean = (value: string | undefined): string =>
  (value ?? '').replace(/\s+/g, ' ').trim()

/** Drop a trailing CIK asterisk and a trailing parenthetical note. */
export const cleanCountryName = (name: string): string =>
  clean(name)
    .replace(/\s*\*+$/, '')
    .replace(/\s*\([^)]*\)$/, '')
    .trim()

/**
 * Split a SIC label into town and place, the same way
 * scripts/sections-preprocess/build_sections_csv.py does for the seed:
 *
 * - `Лондон (Посолство 1)` → `Лондон` / `Посолство 1`
 * - `Анкара (Посолство) 1` → `Анкара` / `Посолство 1`
 * - `Виена (Посолски комплекс) - ПК Нашмаркт` → `Виена` / `Посолски комплекс ПК Нашмаркт`
 * - `Леобен*` → `Леобен` / `Леобен`
 * - `остров Крит, Ираклио` → `остров Крит, Ираклио` / `остров Крит, Ираклио`
 */
export const splitSicLabel = (
  label: string,
): { townName: string; place: string } => {
  const raw = clean(label).replace(/\s*\*+$/, '')
  const match = /\s*\(([^)]+)\)\s*/.exec(raw)
  if (!match) {
    return { townName: raw, place: raw }
  }
  const city = raw.slice(0, match.index).trim()
  const trailing = raw
    .slice(match.index + match[0].length)
    .trim()
    .replace(/^-+/, '')
    .trim()
  const tag = `${match[1].trim()} ${trailing}`.trim()
  const townName = city || tag
  return { townName, place: tag || townName }
}

const parseCount = (
  value: string | undefined,
  field: string,
  rowRef: string,
  errors: string[],
): number | null => {
  const v = clean(value)
  if (v === '') {
    return null
  }
  if (!/^\d+$/.test(v)) {
    errors.push(`${rowRef}: invalid ${field} "${v}"`)
    return null
  }
  return parseInt(v, 10)
}

const ABROAD_SECTION_ID = new RegExp(`^${ELECTION_REGION_ABROAD}\\d{7}$`)

/**
 * Validate and normalise raw rows. Throws AbroadSectionsInputError listing
 * every problem found; nothing is returned unless the whole input is valid.
 *
 * A blank country cell repeats the previous one (as in the CIK sheet).
 * Total rows (`Общо: …`) and fully blank rows are skipped.
 */
export function normaliseAbroadSections(
  rows: AbroadSectionRawRow[],
): AbroadSectionInput[] {
  const errors: string[] = []
  const sections: AbroadSectionInput[] = []
  const seenIds = new Map<string, number>()
  const countryNames = new Map<string, string>()
  let currentCountry = ''

  rows.forEach((raw, index) => {
    // +2: header line and 1-based numbering, so this matches the sheet row
    const rowRef = `row ${index + 2}`
    const row = pick(raw)
    const country = clean(row.country)
    const sectionId = clean(row.sectionId).replace(/\s/g, '')
    const label = clean(row.label)

    if (country && !country.startsWith('Общо')) {
      currentCountry = country
    }
    if (!sectionId) {
      if (label) {
        errors.push(`${rowRef}: missing section id for "${label}"`)
      }
      return
    }
    if (!ABROAD_SECTION_ID.test(sectionId)) {
      errors.push(
        `${rowRef}: section id "${sectionId}" is not a 9-digit abroad id starting with ${ELECTION_REGION_ABROAD}`,
      )
      return
    }
    if (seenIds.has(sectionId)) {
      errors.push(
        `${rowRef}: duplicate section id ${sectionId} (first seen on row ${seenIds.get(
          sectionId,
        )})`,
      )
      return
    }
    seenIds.set(sectionId, index + 2)

    const countryCode = sectionId.slice(2, 5)
    if (countryCode === '000') {
      errors.push(`${rowRef}: section ${sectionId} has country code 000`)
      return
    }
    const countryName = cleanCountryName(currentCountry)
    if (!countryName) {
      errors.push(`${rowRef}: missing country for section ${sectionId}`)
      return
    }
    const knownName = countryNames.get(countryCode)
    if (knownName === undefined) {
      countryNames.set(countryCode, countryName)
    } else if (knownName !== countryName) {
      errors.push(
        `${rowRef}: country code ${countryCode} is "${knownName}" on an earlier row but "${countryName}" here`,
      )
      return
    }
    if (!label) {
      errors.push(`${rowRef}: missing SIC label for section ${sectionId}`)
      return
    }
    const { townName, place } = splitSicLabel(label)
    if (!townName) {
      errors.push(`${rowRef}: cannot derive a town from "${label}"`)
      return
    }

    const votersCount = parseCount(row.voters, 'voters', rowRef, errors)
    const machinesCount =
      parseCount(row.machines, 'machines', rowRef, errors) ?? 0

    sections.push({
      sectionId,
      sectionCode: sectionId.slice(6, 9),
      countryCode,
      countryName,
      townName,
      place,
      votersCount,
      machinesCount,
    })
  })

  // Two country codes must not share one name: countries.name is unique.
  const codesByName = new Map<string, string>()
  for (const [code, name] of countryNames) {
    const other = codesByName.get(name.toLowerCase())
    if (other) {
      errors.push(
        `country "${name}" is used for both codes ${other} and ${code}`,
      )
    } else {
      codesByName.set(name.toLowerCase(), code)
    }
  }

  if (errors.length > 0) {
    throw new AbroadSectionsInputError(errors)
  }
  if (sections.length === 0) {
    throw new AbroadSectionsInputError(['no abroad sections in the input'])
  }

  return sections
}

/** Parse the CIK sheet exported as CSV (UTF-8, comma separated, header row). */
export function parseAbroadSectionsCsv(
  input: Readable | Buffer | string,
): Promise<AbroadSectionInput[]> {
  const stream =
    input instanceof Readable ? input : Readable.from([Buffer.from(input)])

  return new Promise((resolve, reject) => {
    const rows: AbroadSectionRawRow[] = []
    const parser = parse({
      bom: true,
      columns: (header: string[]) => header.map((h) => h.trim()),
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    })
    parser.on('readable', () => {
      let record: AbroadSectionRawRow
      while ((record = parser.read() as AbroadSectionRawRow) !== null) {
        rows.push(record)
      }
    })
    parser.on('error', (error: Error) => {
      reject(
        new AbroadSectionsInputError([`failed to parse CSV: ${error.message}`]),
      )
    })
    parser.on('end', () => {
      try {
        resolve(normaliseAbroadSections(rows))
      } catch (e) {
        reject(e)
      }
    })
    stream.on('error', reject)
    stream.pipe(parser)
  })
}
