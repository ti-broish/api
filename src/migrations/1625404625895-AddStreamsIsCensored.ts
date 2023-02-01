import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStreamsIsCensored1625404625895 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      alter table "streams" add column "is_censored" boolean default false;
      create index "streams_is_censored_index" on "streams" ("is_censored");
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      drop index "streams_is_censored_index";
      alter table "streams" drop column is_censored;
    `)
  }
}
