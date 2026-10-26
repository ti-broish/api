/**
 * Set the street addresses of the abroad sections (32*) from a CSV, straight
 * against the database configured in .env (DATABASE_*). Same code as
 * PATCH /sections/abroad/addresses: only the address of existing sections is
 * written, unknown ids are reported and never created.
 *
 *   uv run scripts/sections-preprocess/mfa_abroad_addresses.py adresi.xlsx > abroad-addresses.csv
 *   npm run sections:update-abroad-addresses -- abroad-addresses.csv --dry-run
 *   npm run sections:update-abroad-addresses -- abroad-addresses.csv
 */
import * as fs from 'fs'
import { AppDataSource } from '../src/database/typeorm.datasource'
import {
  AbroadAddressesInputError,
  parseAbroadAddressesCsv,
  summarizeAbroadAddresses,
  updateAbroadAddresses,
} from '../src/sections/abroad-addresses'

async function main(): Promise<number> {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const verbose = args.includes('--verbose')
  const file = args.find((a) => !a.startsWith('--'))
  if (!file) {
    console.error(
      'Usage: npm run sections:update-abroad-addresses -- <file.csv> [--dry-run] [--verbose]',
    )
    return 2
  }
  const input = parseAbroadAddressesCsv(fs.readFileSync(file))
  console.error(
    `Parsed ${input.length} abroad addresses from ${file}. Database: ${
      AppDataSource.options.database as string
    }${dryRun ? ' (dry run)' : ''}`,
  )
  await AppDataSource.initialize()
  try {
    const report = await updateAbroadAddresses(AppDataSource, input, {
      dryRun,
    })
    console.error(summarizeAbroadAddresses(report))
    console.log(
      JSON.stringify(
        verbose ? report : { updated: report.updated, unknown: report.unknown },
        null,
        2,
      ),
    )
  } finally {
    await AppDataSource.destroy()
  }
  return 0
}

// exitCode, not process.exit(): exiting at once cuts off a long report
// written to a pipe (e.g. over ssh).
main().then(
  (code) => {
    process.exitCode = code
  },
  (e: Error) => {
    console.error(e instanceof AbroadAddressesInputError ? e.message : e)
    process.exitCode = 1
  },
)
