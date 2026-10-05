/**
 * Replace the abroad sections (election region 32) from the CIK sheet CSV,
 * straight against the database configured in .env (DATABASE_*).
 * Same code path as `PUT /sections/abroad`.
 *
 *   npm run sections:update-abroad -- path/to/sections_abroad.csv --dry-run
 *   npm run sections:update-abroad -- path/to/sections_abroad.csv
 */
import * as fs from 'fs'
import { AppDataSource } from '../src/database/typeorm.datasource'
import {
  AbroadSectionsInputError,
  parseAbroadSectionsCsv,
} from '../src/sections/abroad/abroad-sections.parser'
import {
  AbroadSectionsConflictError,
  updateAbroadSections,
} from '../src/sections/abroad/abroad-sections.updater'

async function main(): Promise<number> {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const verbose = args.includes('--verbose')
  const file = args.find((a) => !a.startsWith('--'))
  if (!file) {
    console.error(
      'Usage: npm run sections:update-abroad -- <file.csv> [--dry-run] [--verbose]',
    )
    return 2
  }

  const sections = await parseAbroadSectionsCsv(fs.createReadStream(file))
  console.error(
    `Parsed ${sections.length} abroad sections from ${file}. Database: ${
      AppDataSource.options.database as string
    }${dryRun ? ' (dry run)' : ''}`,
  )

  await AppDataSource.initialize()
  try {
    const report = await updateAbroadSections(AppDataSource, sections, {
      dryRun,
    })
    const summary = {
      dryRun: report.dryRun,
      received: report.received,
      sections: {
        created: report.sections.created.length,
        updated: report.sections.updated.length,
        unchanged: report.sections.unchanged,
        deleted: report.sections.deleted.length,
        kept: report.sections.kept.length,
      },
      countries: {
        created: report.countries.created,
        renamed: report.countries.renamed,
        deleted: report.countries.deleted,
        kept: report.countries.kept,
      },
      towns: {
        created: report.towns.created.length,
        deleted: report.towns.deleted.length,
        kept: report.towns.kept,
      },
      keptSections: report.sections.kept,
    }
    console.log(JSON.stringify(verbose ? report : summary, null, 2))
  } finally {
    await AppDataSource.destroy()
  }
  return 0
}

main().then(
  (code) => process.exit(code),
  (e: Error) => {
    if (
      e instanceof AbroadSectionsInputError ||
      e instanceof AbroadSectionsConflictError
    ) {
      console.error(e.message)
      process.exit(1)
    }
    console.error(e)
    process.exit(1)
  },
)
