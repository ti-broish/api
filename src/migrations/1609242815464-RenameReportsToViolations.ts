import {MigrationInterface, QueryRunner} from "typeorm";

export class RenameReportsToViolations1609242815464 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "reports" rename to "violations";
        alter table "report_updates" rename to "violation_updates";
        alter table "reports_pictures" rename to "violations_pictures";
        alter table "violations_pictures" rename column "report_id" to "violation_id";
        alter table "violation_updates" rename column "report_id" to "violation_id";
        alter table "violations" rename constraint "reports_pkey" to "violations_pkey";
        alter index "reports_section_id_status" rename to "violations_section_id_status_key";
        alter table "violation_updates" rename constraint "report_updates_pkey" to "violation_updates_pkey";
        alter index "report_updates_report_id_timestamp_key" rename to "violation_updates_violation_id_timestamp_key";
        alter index "report_updates_report_id_type_timestamp_key" rename to "violation_updates_violation_id_type_timestamp_key";
        alter table "violations_pictures" rename constraint "reports_pictures_pkey" to "violations_pictures_pkey";
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "violations_pictures" rename constraint "violations_pictures_pkey" to "reports_pictures_pkey";
        alter index "violation_updates_violation_id_type_timestamp_key" rename to "report_updates_report_id_type_timestamp_key";
        alter index "violation_updates_violation_id_timestamp_key" rename to "report_updates_report_id_timestamp_key";
        alter table "violation_updates" rename constraint "violation_updates_pkey" to "report_updates_pkey";
        alter index "violations_section_id_status_key" rename to "reports_section_id_status";
        alter table "violations" rename constraint "violations_pkey" to "reports_pkey";
        alter table "violation_updates" rename column "violation_id" to "report_id";
        alter table "violations_pictures" rename column "violation_id" to "report_id";
        alter table "violations" rename to "reports";
        alter table "violation_updates" rename to "report_updates";
        alter table "violations_pictures" rename to "reports_pictures";
      `);
    }

}
