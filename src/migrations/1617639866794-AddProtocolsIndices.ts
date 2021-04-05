import {MigrationInterface, QueryRunner} from "typeorm";

export class AddProtocolsIndices1617639866794 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        create index "protocols_section_id_status_key" on "protocols" ("section_id", "status");
        create index "protocols_status_key" on "protocols" ("status");
        create index "protocols_origin_key" on "protocols" ("origin");
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        drop index "protocols_section_id_status_key";
        drop index "protocols_status_key";
        drop index "protocols_origin_key";
      `);
    }

}
