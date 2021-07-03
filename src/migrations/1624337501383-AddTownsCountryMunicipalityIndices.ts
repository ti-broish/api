import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTownsCountryMunicipalityIndices1624337501383
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create index "towns_country_id_key" on "towns" ("country_id");
        create index "towns_municipality_id_key" on "towns" ("country_id");
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        drop index "towns_municipality_id_key";
        drop index "towns_country_id_key";
      `);
  }
}
