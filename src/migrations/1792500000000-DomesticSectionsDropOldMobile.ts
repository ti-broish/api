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

const REGISTER = path.join(
  __dirname,
  '..',
  'seeds',
  '2026-10-25',
  'domestic-sections.csv',
)
const KEEP = ['082900015', '153900020', '301900016']

/**
 * Re-apply the CIK register of 25 Oct 2026 without keeping mobile ballot boxes it does not
 * list: the register lists this election's mobile ones, so the rest (269 on staging) are left
 * over from earlier elections. Referenced sections and KEEP are still kept. Abroad untouched.
 */
export class DomesticSectionsDropOldMobile1792500000000
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
        keepMobile: false,
      })
      console.log(
        `[domestic sections] ${JSON.stringify(
          summarizeDomesticSections(report),
        )}`,
      )
    } catch (error) {
      if (error instanceof DomesticSectionsConflictError) {
        console.log(`[domestic sections] skipped: ${error.message}`)
        return
      }
      throw error
    }
  }

  public async down(): Promise<void> {
    // Deleted sections are not restored.
  }
}
