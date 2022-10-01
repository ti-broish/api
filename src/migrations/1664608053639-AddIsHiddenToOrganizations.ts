import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsHiddenToOrganizations1664608053639
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "organizations" add column "is_hidden" boolean;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "organizations" drop column "is_hidden";
      `);
  }
}
