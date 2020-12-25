import {MigrationInterface, QueryRunner} from "typeorm";

export class ReportsUpdatesDropStatusAddType1608933294974 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        drop index "report_updates_status_key";
        drop index "report_updates_actor_id_timestamp_key";
        alter table "report_updates"
          drop column "status",
          add column "type" varchar,
          add column "payload" json,
          alter column timestamp set default CURRENT_TIMESTAMP;
        drop type "report_status";
        create index "report_updates_report_id_type_timestamp_key" on "report_updates" ("report_id", "type", "timestamp");
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        drop index "report_updates_report_id_type_timestamp_key";
        create type "report_status" AS ENUM('pending', 'processing', 'processed', 'rejected');
        alter table "report_updates"
          add column "status" report_status,
          drop column "type",
          drop column payload,
          alter column timestamp drop default;
        create index "report_updates_actor_id_timestamp_key" on "report_updates" ("actor_id", "timestamp");
        create index "report_updates_status_key" on "report_updates" ("status");
      `);
    }
}
