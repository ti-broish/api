import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStreamsIsCensored1625404625895 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            alter table "streams" add column "is_censored" boolean default false
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            alter table "streams" drop column is_censored
      `);
  }
}
