import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSecretToProtocolsAndViolations1679015326884
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "protocols" ADD "secret" varchar DEFAULT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "violations" ADD "secret" varchar DEFAULT NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "violations" DROP COLUMN "secret"`)
    await queryRunner.query(`ALTER TABLE "protocols" DROP COLUMN "secret"`)
  }
}
