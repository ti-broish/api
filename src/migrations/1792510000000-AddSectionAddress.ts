import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Street address of a section. Abroad sections get theirs from the МВнР table
 * (PATCH /sections/abroad/addresses); domestic ones keep using `place` until
 * this is filled in, see src/sections/section-address.ts.
 */
export class AddSectionAddress1792510000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sections" ADD COLUMN IF NOT EXISTS "address" text NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sections" DROP COLUMN IF EXISTS "address"`,
    )
  }
}
