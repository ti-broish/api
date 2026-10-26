import { DataSource, EntityManager } from 'typeorm'
import { AbroadAddressInput } from './abroad-addresses.parser'

export interface AbroadAddressChange {
  id: string
  from: string | null
  to: string
}

export interface AbroadAddressesReport {
  dryRun: boolean
  received: number
  updated: AbroadAddressChange[]
  unchanged: number
  /** Ids that are not abroad sections in the database. Never created. */
  unknown: string[]
}

const LOCK = 'ti-broish:update-abroad-addresses'

/**
 * Sets the address of existing abroad (32*) sections. Only the address
 * column is written: no section is created, deleted or otherwise changed,
 * and ids that are not in the database are reported back as unknown.
 */
export async function applyAbroadAddresses(
  manager: EntityManager,
  input: AbroadAddressInput[],
  options: { dryRun?: boolean } = {},
): Promise<AbroadAddressesReport> {
  await manager.query('select pg_advisory_xact_lock(hashtext($1))', [LOCK])
  const ids = input.map((row) => row.sectionId)
  const rows: Array<{ id: string; address: string | null }> =
    await manager.query(
      `select trim(id) as id, address from sections
        where id like '32%' and trim(id) = any($1::text[])`,
      [ids],
    )
  const current = new Map(rows.map((row) => [row.id, row.address]))

  const updated: AbroadAddressChange[] = []
  const unknown: string[] = []
  let unchanged = 0
  for (const { sectionId, address } of input) {
    if (!current.has(sectionId)) {
      unknown.push(sectionId)
    } else if (current.get(sectionId) === address) {
      unchanged++
    } else {
      updated.push({ id: sectionId, from: current.get(sectionId), to: address })
    }
  }

  if (updated.length > 0) {
    await manager.query(
      `update sections as s set address = v.address
         from unnest($1::text[], $2::text[]) as v(id, address)
        where trim(s.id) = v.id and s.id like '32%'`,
      [updated.map((row) => row.id), updated.map((row) => row.to)],
    )
  }

  return {
    dryRun: !!options.dryRun,
    received: input.length,
    updated,
    unchanged,
    unknown,
  }
}

/** applyAbroadAddresses in its own transaction, rolled back on dryRun. */
export async function updateAbroadAddresses(
  dataSource: DataSource,
  input: AbroadAddressInput[],
  options: { dryRun?: boolean } = {},
): Promise<AbroadAddressesReport> {
  const queryRunner = dataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()
  try {
    const report = await applyAbroadAddresses(
      queryRunner.manager,
      input,
      options,
    )
    if (options.dryRun) {
      await queryRunner.rollbackTransaction()
    } else {
      await queryRunner.commitTransaction()
    }
    return report
  } catch (error) {
    await queryRunner.rollbackTransaction()
    throw error
  } finally {
    await queryRunner.release()
  }
}

export function summarizeAbroadAddresses(
  report: AbroadAddressesReport,
): string {
  return [
    report.dryRun ? 'DRY RUN (nothing written)' : 'Applied',
    `received ${report.received}`,
    `updated ${report.updated.length}`,
    `unchanged ${report.unchanged}`,
    `unknown ${report.unknown.length}${
      report.unknown.length ? ` (${report.unknown.join(', ')})` : ''
    }`,
  ].join(', ')
}
