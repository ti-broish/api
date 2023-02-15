import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeOrganizationsIsHiddenDefaultToBoolean1676411442647
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "organizations" SET "is_hidden" = false WHERE "is_hidden" IS NULL;
      ALTER TABLE "organizations" ALTER COLUMN "is_hidden" SET NOT NULL;
      ALTER TABLE "organizations" ALTER COLUMN "is_hidden" SET DEFAULT FALSE;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organizations" ALTER COLUMN "is_hidden" DROP NOT NULL;
      ALTER TABLE "organizations" ALTER COLUMN "is_hidden" SET DEFAULT NULL;
    `)
  }
}
