import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeProtocolsSectionOptional1676413609314
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "protocols" ALTER COLUMN "section_id" DROP NOT NULL;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "protocols" ALTER COLUMN "section_id" SET NOT NULL;
    `)
  }
}
