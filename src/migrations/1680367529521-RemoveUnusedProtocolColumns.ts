import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveUnusedProtocolColumns1680367529521
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "protocol_results" DROP COLUMN "machine_votes_count"`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "protocol_results" ADD "machine_votes_count" integer NOT NULL`,
    )
  }
}
