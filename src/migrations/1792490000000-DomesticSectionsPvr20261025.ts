import * as fs from 'fs'
import * as path from 'path'
import { MigrationInterface, QueryRunner } from 'typeorm'
import {
  applyDomesticSections,
  countDomesticSections,
  DomesticSectionsConflictError,
  parseDomesticSectionsCsv,
  summarizeDomesticSections,
} from '../sections/domestic'

/** Register: CIK „Адреси на избирателните секции“ for the 25 Oct 2026 presidential election. */
const REGISTER = path.join(
  __dirname,
  '..',
  'seeds',
  '2026-10-25',
  'domestic-sections.csv',
)

/**
 * Sections the signup app (tibroish.bg) still points at although CIK no longer lists them:
 * kept so its data does not dangle. 082900015 and 301900016 are in the priority list,
 * 153900020 has a partner draft.
 */
const KEEP = ['082900015', '153900020', '301900016']

/**
 * Bring the domestic sections in line with the CIK register of 25 Oct 2026:
 * add the sections that are missing (e.g. 111800077, с. Умаревци), and delete the ones
 * CIK no longer lists unless something references them or they are mobile ballot boxes.
 * Abroad (МИР 32) is untouched. A database without domestic sections (a fresh one that
 * is seeded later) is skipped. Re-run later registers with `npm run sections:update-domestic`.
 */
export class DomesticSectionsPvr202610251792490000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if ((await countDomesticSections(queryRunner.manager)) === 0) {
      console.log(
        '[domestic sections] no domestic sections in this database: skipped',
      )
      return
    }
    const input = parseDomesticSectionsCsv(fs.readFileSync(REGISTER))
    try {
      const report = await applyDomesticSections(queryRunner.manager, input, {
        keep: KEEP,
      })
      console.log(
        `[domestic sections] ${JSON.stringify(
          summarizeDomesticSections(report),
        )}`,
      )
    } catch (error) {
      if (error instanceof DomesticSectionsConflictError) {
        // A database holding another register (e.g. an old staging copy): leave it alone.
        console.log(`[domestic sections] skipped: ${error.message}`)
        return
      }
      throw error
    }
  }

  public async down(): Promise<void> {
    // Deleted sections are not restored: re-run an older register with `npm run sections:update-domestic`.
  }
}
