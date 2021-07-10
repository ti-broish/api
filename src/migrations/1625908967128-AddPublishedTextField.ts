import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublishedTextField1625908967128 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            alter table "violations" add column "publishedText" varchar;
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            alter table "violations" drop column "publishedText" varchar;
            `);
  }
}
