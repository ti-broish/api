import { csvToSql } from 'src/utils/csvToSql'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class RiskySections1676787373554 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('COMMIT')
    await queryRunner.query('BEGIN')
    await queryRunner.query(`
      create table if not exists "risky_sections" (
        "section_id" char(9),
        "risk_level" varchar,
        primary key ("section_id")
      );
    `)

    void (await queryRunner.query(
      await csvToSql(__dirname + '/risky_sections.csv', 'risky_sections'),
    ))
    await queryRunner.query(`
      UPDATE "sections"
      SET risk_level = risky_sections.risk_level
      FROM risky_sections
      WHERE risky_sections.section_id = sections.id
    `)
    await queryRunner.query('DROP TABLE IF EXISTS "risky_sections"')
    await queryRunner.query('COMMIT')
    await queryRunner.query('START TRANSACTION')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "risky_sections"')
  }
}
