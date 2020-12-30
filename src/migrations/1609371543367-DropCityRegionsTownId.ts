import {MigrationInterface, QueryRunner} from "typeorm";

export class DropCityRegionsTownId1609371543367 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "city_regions" drop column "town_id";
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "city_regions"
        add column "town_id" int,
        add constraint "city_regions_town_id_fkey" foreign key ("town_id") references "towns" ("id");
      `);
    }

}
