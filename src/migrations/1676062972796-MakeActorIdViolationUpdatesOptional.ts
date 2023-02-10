import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeActorIdViolationUpdatesOptional1676062972796
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "violation_updates" ALTER COLUMN "actor_id" DROP NOT NULL;
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "violation_updates" ALTER COLUMN "actor_id" SET NOT NULL;
        `)
  }
}
