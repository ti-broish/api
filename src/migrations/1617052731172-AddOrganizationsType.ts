import {MigrationInterface, QueryRunner} from "typeorm";

export class AddOrganizationsType1617052731172 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "organizations"
        add column "type" varchar;
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "organizations"
        drop column "type";
      `);
    }

}
