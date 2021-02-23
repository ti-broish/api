import {MigrationInterface, QueryRunner} from "typeorm";

export class PartiesIsFeaturedColor1614117655175 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "parties"
        add column "is_featured" boolean not null default false,
        add column "color" char(6) default null;
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "parties"
        drop column "is_featured",
        drop column "color";
      `);
    }

}
