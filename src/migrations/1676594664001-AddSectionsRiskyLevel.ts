import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSectionsRiskyLevel1676594664001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      alter table "sections" add column "risk_level" varchar;
      update "sections" set "risk_level" = 'none';
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      alter table "sections" drop column "risk_level";
    `)
  }
}
