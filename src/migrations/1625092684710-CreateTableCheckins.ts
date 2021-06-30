import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableCheckins1625092684710 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create table checkins (
          id bpchar(26) not null,
          actor_id bpchar(26) not null,
          section_id char(9) default null,
          timestamp timestamp default CURRENT_TIMESTAMP,
          primary key("id"),
          constraint "checkins_section_id_fkey" foreign key ("section_id") references "sections" ("id"),
          constraint "checkins_actor_id_fkey" foreign key ("actor_id") references "people" ("id")
        );
      `);

    await queryRunner.query(`
        create index "checkins_actor_id_timestamp_key" on "checkins" ("actor_id", "timestamp");
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        drop index "checkins_actor_id_timestamp_key";
      `);
    await queryRunner.query(`
        drop table checkins;
      `);
  }
}
