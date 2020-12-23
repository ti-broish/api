import {MigrationInterface, QueryRunner} from "typeorm";

export class ProtocolStatusEnum1608597091644 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "protocols" alter column "status" drop default;
        alter table "protocols" alter column "origin" drop default;
        alter table "protocol_actions" alter column "action" drop default;
        alter table "protocols" alter column "status" set not null;
        alter table "protocols" alter column "origin" set not null;
        alter table "protocol_actions" alter column "action" set not null;
        alter table "protocols" alter column "status" type varchar;
        alter table "protocols" alter column "origin" type varchar;
        alter table "protocol_actions" alter column "action" type varchar;
      `);
      await queryRunner.query(`
        drop type "protocol_origin";
        drop type "protocol_status";
        drop type "protocol_action";
      `);
      await queryRunner.query(`
        alter table "protocols" add column "parent_id" bpchar(26) default null;
      `);
      await queryRunner.query(`
        drop index "protocol_data_data_key";
      `);
      await queryRunner.query(`
        alter table "protocol_data"
        add column "valid_votes_count" int default null,
        add column "invalid_votes_count" int default null,
        add column "machine_votes_count" int default null,
        drop column "data";
      `);
      await queryRunner.query(`
        CREATE TABLE "protocol_results" (
          "id" bpchar(26) NOT NULL,
          "protocol_id" bpchar(26) NOT NULL,
          "party_id" smallint NOT NULL,
          "valid_votes_count" int NOT NULL,
          "invalid_votes_count" int DEFAULT NULL,
          "created_at" timestamp NOT NULL,
          PRIMARY KEY ("id"),
          CONSTRAINT "protocol_results_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocols" ("id"),
          CONSTRAINT "protocol_results_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties" ("id")
        );
      `);

      await queryRunner.query(`
        CREATE INDEX "protocol_results_protocol_id_party_id_valid_votes_count_key" on "protocol_results" ("protocol_id", "party_id", "valid_votes_count");
        CREATE INDEX "protocol_results_party_id_valid_votes_count_key" on "protocol_results" ("party_id", "valid_votes_count");
      `);

      await queryRunner.query(`
        CREATE INDEX "protocols_section_id_status_key" on "protocols" ("section_id", "status");
        CREATE INDEX "protocols_status_key" on "protocols" ("status");
        CREATE INDEX "protocols_parent_id_key" on "protocols" ("parent_id");
      `);

      await queryRunner.query(`
        CREATE INDEX "protocol_data_protocol_id_valid_votes_count_key" on "protocol_data" ("protocol_id", "valid_votes_count");
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        drop index "protocol_data_protocol_id_valid_votes_count_key";
      `);
      await queryRunner.query(`
        drop index "protocols_section_id_status_key";
        drop index "protocols_status_key";
        drop index "protocols_parent_id_key";
      `);
      await queryRunner.query(`
        drop index "protocol_results_protocol_id_party_id_valid_votes_count_key";
        drop index "protocol_results_party_id_valid_votes_count_key";
      `);
      await queryRunner.query(`
        drop table "protocol_results";
      `);
      await queryRunner.query(`
        alter table "protocol_data"
        drop column "valid_votes_count",
        drop column "invalid_votes_count",
        drop column "machine_votes_count",
        add column "data" jsonb;
      `);
      await queryRunner.query(`
        CREATE INDEX "protocol_data_data_key" on "protocol_data" USING gin("data");
      `);
      await queryRunner.query(`
        alter table "protocols" drop column "parent_id";
      `);
      await queryRunner.query(`
        CREATE TYPE "protocol_origin" AS ENUM('ti-broish', 'cik');
        CREATE TYPE "protocol_status" AS ENUM('pending', 'processing', 'processed', 'rejected');
        CREATE TYPE "protocol_action" AS ENUM('submitted', 'assigned_to', 'edited', 'approved', 'rejected');
      `);
      await queryRunner.query(`
        alter table "protocols" drop column "origin";
        alter table "protocols" drop column "status";
        alter table "protocol_actions" drop column "action";
        alter table "protocols" add column "status" protocol_origin default 'ti-broish' not null;
        alter table "protocols" add column "origin" protocol_status default 'pending' not null;
        alter table "protocol_actions" add column "action" protocol_action not null;
      `);
    }

}
