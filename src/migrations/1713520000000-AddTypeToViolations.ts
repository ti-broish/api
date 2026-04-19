import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTypeToViolations1713520000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "violations" ADD "type" varchar NOT NULL DEFAULT 'standard'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "violations" DROP COLUMN "type"`)
  }
}
