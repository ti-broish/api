import { MigrationInterface, QueryRunner } from 'typeorm';

export class CityRegionsTownsManyToMany1609358207839
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create table "city_regions_towns" (
          "city_region_id" smallint not null,
          "town_id" int not null,
          primary key ("city_region_id", "town_id"),
          constraint "city_regions_towns_city_region_id_fkey" foreign key ("city_region_id") references "city_regions" ("id"),
          constraint "city_regions_towns_town_id_fkey" foreign key ("town_id") references "towns" ("id")
        );
        create index "city_regions_towns_town_id_key" on "city_regions_towns" ("town_id");
        alter table "city_regions" alter column "town_id" drop not null;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        drop index "city_regions_towns_town_id_key";
        drop table "city_regions_towns";
      `);
  }
}
