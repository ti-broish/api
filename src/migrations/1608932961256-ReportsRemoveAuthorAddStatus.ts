import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReportsRemoveAuthorAddStatus1608932961256
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "reports"
        add column "status" varchar,
        drop column "author_id";
      `);
    await queryRunner.query(`
        CREATE INDEX "reports_section_id_status" on "reports" ("section_id", "status");
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP INDEX "reports_section_id_status";
      `);
    await queryRunner.query(`
        alter table "reports"
        drop column "status",
        add column "author_id" bpchar(26);
      `);
  }
}
