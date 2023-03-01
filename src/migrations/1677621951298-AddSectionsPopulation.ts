import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSectionsPopulation1677621951298 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      alter table "sections" add column "population" int default 0;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      alter table "sections" drop column "population";
    `)
  }
}
