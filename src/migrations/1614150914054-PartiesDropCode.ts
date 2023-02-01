import { MigrationInterface, QueryRunner } from 'typeorm'

export class PartiesDropCode1614150914054 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "parties" drop column "code";
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "parties"
        add column "code" int
      `)
    await queryRunner.query(`
        update "parties" set "code" = "id";
      `)
    await queryRunner.query(`
        alter table "parties" alter column "code" set not null;
      `)
  }
}
