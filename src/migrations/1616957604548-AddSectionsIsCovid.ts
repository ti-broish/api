import {MigrationInterface, QueryRunner} from "typeorm";

export class AddSectionsIsCovid1616957604548 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "sections"
        add column "is_covid" boolean default false;
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "sections"
        drop column "is_covid";
      `);
    }

}
