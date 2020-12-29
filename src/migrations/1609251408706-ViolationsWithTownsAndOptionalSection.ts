import {MigrationInterface, QueryRunner} from "typeorm";

export class ViolationsWithTownsAndOptionalSection1609251408706 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "violations"
        add column "town_id" int default null,
        alter column "section_id" set default null,
        alter column "section_id" drop not null,
        add constraint "violations_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns" ("id");
      `);
      await queryRunner.query(`
        update "violations"
        set "town_id" = "sections"."town_id"
        from "sections"
        where "sections"."id" = "violations"."section_id";
      `);
      await queryRunner.query(`
        alter table "violations"
        alter column "town_id" set not null,
        alter column "town_id" drop default;
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "violations"
        drop constraint "violations_town_id_fkey",
        drop column "town_id",
        alter column "section_id" set not null,
        alter column "section_id" drop default;
      `);
    }

}
