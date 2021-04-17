import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViolationsIsPublished1616659598605
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "violations"
        add column "is_published" boolean default false;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "violations"
        drop column "is_published";
      `);
  }
}
