import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakePicturesAuthorOptional1675927897487
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pictures" ALTER COLUMN "author_id" DROP NOT NULL;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pictures" ALTER COLUMN "author_id" SET NOT NULL;
    `)
  }
}
