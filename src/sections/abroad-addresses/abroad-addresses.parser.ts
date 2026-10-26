import { parse } from 'csv-parse/sync'

/** One abroad section's street address, as sent to PATCH /sections/abroad/addresses. */
export interface AbroadAddressInput {
  sectionId: string
  address: string
}

export class AbroadAddressesInputError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Invalid abroad addresses: ${problems.join('; ')}`)
  }
}

const ABROAD_SECTION_ID = /^32\d{7}$/

const ID_HEADERS = [
  'section_id',
  'id',
  'section',
  '№ на секция',
  'номер на секция',
]
const ADDRESS_HEADERS = ['address', 'адрес']

const normalizeHeader = (header: string): string =>
  header
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()

const squash = (value: unknown): string =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Checks the rows and drops repeats: every id is a 32xxxxxxx section, every
 * address is non-empty, and an id repeated with another address is an error.
 */
export function validateAbroadAddresses(
  rows: Array<{ sectionId?: unknown; address?: unknown }>,
): AbroadAddressInput[] {
  const problems: string[] = []
  const byId = new Map<string, string>()
  rows.forEach((row, index) => {
    const line = `row ${index + 1}`
    const sectionId = String(row.sectionId ?? '').replace(/\s+/g, '')
    const address = squash(row.address)
    if (!ABROAD_SECTION_ID.test(sectionId)) {
      problems.push(
        `${line}: "${sectionId}" is not an abroad section id (32xxxxxxx)`,
      )
      return
    }
    if (!address) {
      problems.push(`${line}: ${sectionId} has no address`)
      return
    }
    const seen = byId.get(sectionId)
    if (seen !== undefined && seen !== address) {
      problems.push(`${line}: ${sectionId} has two different addresses`)
      return
    }
    byId.set(sectionId, address)
  })
  if (byId.size === 0 && problems.length === 0) {
    problems.push('no sections')
  }
  if (problems.length > 0) {
    throw new AbroadAddressesInputError(problems)
  }
  return [...byId].map(([sectionId, address]) => ({ sectionId, address }))
}

/**
 * CSV with a header row: an id column (`section_id`, `id` or `№ на секция`)
 * and an `address` (`Адрес`) column. Other columns are ignored, so the file
 * from scripts/sections-preprocess/mfa_abroad_addresses.py works as is.
 */
export function parseAbroadAddressesCsv(
  input: string | Buffer,
): AbroadAddressInput[] {
  let records: Record<string, string>[]
  try {
    records = parse(input, {
      columns: (header: string[]) => header.map(normalizeHeader),
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
      bom: true,
    })
  } catch (error) {
    throw new AbroadAddressesInputError([`not a CSV file: ${error.message}`])
  }
  const first = records[0] ?? {}
  const idHeader = ID_HEADERS.find((h) => h in first)
  const addressHeader = ADDRESS_HEADERS.find((h) => h in first)
  if (records.length > 0 && (!idHeader || !addressHeader)) {
    throw new AbroadAddressesInputError([
      `the header needs a section id column (${ID_HEADERS.join(
        ', ',
      )}) and an address column (${ADDRESS_HEADERS.join(', ')})`,
    ])
  }
  return validateAbroadAddresses(
    records.map((r) => ({ sectionId: r[idHeader], address: r[addressHeader] })),
  )
}

/** JSON body: `{ "sections": [{ "id": "320902332", "address": "…" }] }` or the bare array. */
export function parseAbroadAddressesJson(body: unknown): AbroadAddressInput[] {
  const list = Array.isArray(body)
    ? body
    : (body as { sections?: unknown })?.sections
  if (!Array.isArray(list)) {
    throw new AbroadAddressesInputError([
      'expected a CSV "file" upload or a JSON body {"sections": [{"id", "address"}]}',
    ])
  }
  return validateAbroadAddresses(
    list.map((item: Record<string, unknown>) => ({
      sectionId: item?.id ?? item?.section_id ?? item?.sectionId,
      address: item?.address,
    })),
  )
}
