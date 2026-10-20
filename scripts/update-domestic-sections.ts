/**
 * Make the domestic sections match a CIK register CSV (built by
 * scripts/sections-preprocess/build_domestic_sections_csv.py), straight against
 * the database configured in .env (DATABASE_*). Same code as the migration.
 *
 *   npm run sections:update-domestic -- src/seeds/2026-10-25/domestic-sections.csv --dry-run
 *   npm run sections:update-domestic -- src/seeds/2026-10-25/domestic-sections.csv --keep=082900015,153900020
 */
import * as fs from 'fs'
import { AppDataSource } from '../src/database/typeorm.datasource'
import {
  DomesticSectionsConflictError,
  DomesticSectionsInputError,
  parseDomesticSectionsCsv,
  summarizeDomesticSections,
  updateDomesticSections,
} from '../src/sections/domestic'

async function main(): Promise<number> {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const verbose = args.includes('--verbose')
  const keepArg = args.find((a) => a.startsWith('--keep='))
  const keep = keepArg
    ? keepArg.slice('--keep='.length).split(',').filter(Boolean)
    : []
  const file = args.find((a) => !a.startsWith('--'))
  if (!file) {
    console.error(
      'Usage: npm run sections:update-domestic -- <file.csv> [--dry-run] [--keep=id,id] [--verbose]',
    )
    return 2
  }
  const sections = parseDomesticSectionsCsv(fs.readFileSync(file))
  console.error(
    `Parsed ${sections.length} domestic sections from ${file}. Database: ${
      AppDataSource.options.database as string
    }${dryRun ? ' (dry run)' : ''}`,
  )
  await AppDataSource.initialize()
  try {
    const report = await updateDomesticSections(AppDataSource, sections, {
      dryRun,
      keep,
    })
    console.log(
      JSON.stringify(
        verbose ? report : summarizeDomesticSections(report),
        null,
        2,
      ),
    )
  } finally {
    await AppDataSource.destroy()
  }
  return 0
}

main().then(
  (code) => process.exit(code),
  (e: Error) => {
    console.error(
      e instanceof DomesticSectionsInputError ||
        e instanceof DomesticSectionsConflictError
        ? e.message
        : e,
    )
    process.exit(1)
  },
)
