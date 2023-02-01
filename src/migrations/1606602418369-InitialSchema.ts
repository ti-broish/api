import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1606602418369 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" smallserial,
        "name" varchar NOT NULL,
        PRIMARY KEY ("id")
      );
    `)

    await queryRunner.query(`
      CREATE TABLE "people" (
        "id" bpchar(26) NOT NULL,
        "first_name" varchar NOT NULL,
        "last_name" varchar NOT NULL,
        "email" varchar NOT NULL,
        "phone" varchar NOT NULL,
        "pin" bpchar(4) NOT NULL,
        "organization_id" smallint NOT NULL,
        "firebase_uid" varchar NOT NULL,
        "roles" json NOT NULL,
        "has_agreed_to_keep_data" boolean DEFAULT false,
        "registered_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE("firebase_uid"),
        CONSTRAINT "people_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "people_email_key" on "people" ("email");
      CREATE INDEX "people_phone_key" on "people" ("phone");
      CREATE INDEX "people_registered_at_key" on "people" ("registered_at");
    `)

    await queryRunner.query(`
      DROP TYPE IF EXISTS "confirmation_type";
      CREATE TYPE "confirmation_type" AS ENUM ('email', 'phone');

      CREATE TABLE "person_confirmations" (
        "id" bpchar(26) NOT NULL,
        "person_id" bpchar(26) NOT NULL,
        "type" confirmation_type NOT NULL,
        "code" varchar NOT NULL,
        "expires_at" timestamp NOT NULL,
        "confirmed_at" timestamp DEFAULT NULL,
        PRIMARY KEY ("id"),
        CONSTRAINT "person_confirmations_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people" ("id")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "person_confirmations_type_code_person_id_key" on "person_confirmations" ("type", "code", "person_id");
      CREATE INDEX "person_confirmations_person_id_confirmed_at_key" on "person_confirmations" ("person_id", "confirmed_at");
    `)

    await queryRunner.query(`
      CREATE TABLE "election_regions" (
        "id" serial NOT NULL,
        "code" bpchar(2) NOT NULL,
        "name" varchar NOT NULL,
        "is_abroad" boolean NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE("code"),
        UNIQUE("name")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "election_regions_is_abroad_key" on "election_regions" ("is_abroad");
    `)

    await queryRunner.query(`
      CREATE TABLE "countries" (
        "id" smallserial NOT NULL,
        "code" bpchar(2) NOT NULL,
        "name" varchar NOT NULL,
        "is_abroad" boolean NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE("code"),
        UNIQUE("name")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "countries_is_abroad_key" on "countries" ("is_abroad");
    `)

    await queryRunner.query(`
      CREATE TABLE "municipalities" (
        "id" SMALLSERIAL,
        "code" bpchar(2) NOT NULL,
        "name" varchar NOT NULL,
        PRIMARY KEY ("id")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "municipalities_code_key" on "municipalities" ("code");
      CREATE INDEX "municipalities_name_key" on "municipalities" ("name");
    `)

    await queryRunner.query(`
      CREATE TABLE "election_regions_municipalities" (
        "election_region_id" smallint,
        "municipality_id" smallint NOT NULL,
        PRIMARY KEY ("election_region_id", "municipality_id"),
        CONSTRAINT "election_regions_municipalities_election_region_id_fkey" FOREIGN KEY ("election_region_id") REFERENCES "election_regions" ("id"),
        CONSTRAINT "election_regions_municipalities_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities" ("id")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "election_regions_municipalities_municipality_id_key" on "election_regions_municipalities" ("municipality_id");
    `)

    await queryRunner.query(`
      CREATE TABLE "towns" (
        "id" SERIAL,
        "name" varchar NOT NULL,
        "code" int NOT NULL,
        "country_id" smallint NOT NULL,
        "municipality_id" smallint DEFAULT NULL,
        PRIMARY KEY ("id"),
        UNIQUE ("code"),
        CONSTRAINT "towns_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries" ("id"),
        CONSTRAINT "towns_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities" ("id")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "towns_name_key" on "towns" ("name");
    `)

    await queryRunner.query(`
      CREATE TABLE "city_regions" (
        "id" smallserial,
        "code" bpchar(2) NOT NULL,
        "name" varchar NOT NULL,
        "town_id" smallint NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE("town_id", "code"),
        CONSTRAINT "city_regions_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns" ("id")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "city_regions_code_key" on "city_regions" ("code");
      CREATE INDEX "city_regions_name_key" on "city_regions" ("name");
    `)

    await queryRunner.query(`
      CREATE TABLE "sections" (
        "id" bpchar(9) NOT NULL,
        "election_region_id" smallint NOT NULL,
        "town_id" smallint NOT NULL,
        "city_region_id" smallint DEFAULT NULL,
        "code" bpchar(3) NOT NULL,
        "place" varchar DEFAULT '' NOT NULL,
        "voters_count" int DEFAULT NULL,
        "is_mobile" boolean,
        "is_ship" boolean,
        "is_machine" boolean,
        PRIMARY KEY ("id"),
        CONSTRAINT "sections_election_region_id_fkey" FOREIGN KEY ("election_region_id") REFERENCES "election_regions" ("id"),
        CONSTRAINT "sections_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns" ("id"),
        CONSTRAINT "sections_city_region_id_fkey" FOREIGN KEY ("city_region_id") REFERENCES "city_regions" ("id")
      );
    `)

    await queryRunner.query(`
      DROP TYPE IF EXISTS "protocol_origin";
      CREATE TYPE "protocol_origin" AS ENUM('ti-broish', 'cik');
      DROP TYPE IF EXISTS "protocol_status";
      CREATE TYPE "protocol_status" AS ENUM('pending', 'processing', 'processed', 'rejected');

      CREATE TABLE "protocols" (
        "id" bpchar(26) NOT NULL,
        "origin" protocol_origin DEFAULT 'ti-broish' NOT NULL,
        "section_id" bpchar(9) NOT NULL,
        "status" smallint NOT NULL,
        PRIMARY KEY ("id"),
        CONSTRAINT "protocols_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections" ("id")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "protocols_status_section_id_key" on "protocols" ("status", "section_id");
    `)

    await queryRunner.query(`
      CREATE TABLE "protocol_data" (
        "id" bpchar(26) NOT NULL,
        "protocol_id" bpchar(26) NOT NULL,
        "data" jsonb NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY ("id"),
        CONSTRAINT "protocol_data_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocols" ("id")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "protocol_data_data_key" on "protocol_data" USING gin("data");
    `)

    await queryRunner.query(`
      DROP TYPE IF EXISTS "protocol_action";
      CREATE TYPE "protocol_action" AS ENUM('submitted', 'assigned_to', 'edited', 'approved', 'rejected');

      CREATE TABLE "protocol_actions" (
        "id" bpchar(26) NOT NULL,
        "protocol_id" bpchar(26) NOT NULL,
        "actor_id" bpchar(26) NOT NULL,
        "action" protocol_action NOT NULL,
        "payload" json DEFAULT NULL,
        "timestamp" timestamp NOT NULL,
        PRIMARY KEY ("id"),
        CONSTRAINT "protocol_actions_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocols" ("id"),
        CONSTRAINT "protocol_actions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "people" ("id")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "protocol_actions_protocol_id_timestamp_key" on "protocol_actions" ("protocol_id", "timestamp");
      CREATE INDEX "protocol_actions_actor_id_timestamp_key" on "protocol_actions" ("actor_id", "timestamp");
      CREATE INDEX "protocol_actions_action_key" on "protocol_actions" ("action");
    `)

    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" bpchar(26) NOT NULL,
        "section_id" bpchar(9) NOT NULL,
        "author_id" bpchar(26) NOT NULL,
        "description" text NOT NULL,
        PRIMARY KEY ("id"),
        CONSTRAINT "reports_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections" ("id"),
        CONSTRAINT "reports_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "people" ("id")
      );
    `)

    await queryRunner.query(`
      DROP TYPE IF EXISTS "report_status";
      CREATE TYPE "report_status" AS ENUM('submitted', 'accepted', 'rejected', 'published');

      CREATE TABLE "report_updates" (
        "id" bpchar(26) NOT NULL,
        "report_id" bpchar(26) NOT NULL,
        "actor_id" bpchar(26) NOT NULL,
        "status" report_status NOT NULL,
        "timestamp" timestamp NOT NULL,
        PRIMARY KEY ("id"),
        CONSTRAINT "reports_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports" ("id"),
        CONSTRAINT "reports_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "people" ("id")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "report_updates_report_id_timestamp_key" on "report_updates" ("report_id", "timestamp");
      CREATE INDEX "report_updates_actor_id_timestamp_key" on "report_updates" ("actor_id", "timestamp");
      CREATE INDEX "report_updates_status_key" on "report_updates" ("status");
    `)

    await queryRunner.query(`
      CREATE TABLE "pictures" (
        "id" bpchar(26) NOT NULL,
        "author_id" bpchar(26) NOT NULL,
        "path" varchar NOT NULL,
        "sort_position" smallint NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY ("id"),
        CONSTRAINT "pictures_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "people" ("id")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "pictures_sort_position_key" on "pictures" ("sort_position");
    `)

    await queryRunner.query(`
      CREATE TABLE "protocols_pictures" (
        "protocol_id" bpchar(26) NOT NULL,
        "picture_id" bpchar(26) NOT NULL,
        PRIMARY KEY ("protocol_id", "picture_id"),
        CONSTRAINT "protocols_pictures_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocols" ("id"),
        CONSTRAINT "protocols_pictures_picture_id_fkey" FOREIGN KEY ("picture_id") REFERENCES "pictures" ("id")
      );
    `)

    await queryRunner.query(`
      CREATE TABLE "reports_pictures" (
        "report_id" bpchar(26) NOT NULL,
        "picture_id" bpchar(26) NOT NULL,
        PRIMARY KEY ("report_id", "picture_id"),
        CONSTRAINT "reports_pictures_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports" ("id"),
        CONSTRAINT "reports_pictures_picture_id_fkey" FOREIGN KEY ("picture_id") REFERENCES "pictures" ("id")
      );
    `)

    await queryRunner.query(`
      CREATE TABLE "parties" (
        "id" serial NOT NULL,
        "code" smallint NOT NULL,
        "name" varchar NOT NULL,
        "display_name" varchar NOT NULL,
        PRIMARY KEY ("id"),
        UNIQUE ("code")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "parties_display_name_key" on "parties" ("display_name");
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "parties";`)
    await queryRunner.query(`DROP TABLE "reports_pictures";`)
    await queryRunner.query(`DROP TABLE "protocols_pictures";`)
    await queryRunner.query(`DROP TABLE "pictures";`)
    await queryRunner.query(`DROP TABLE "report_updates";`)
    await queryRunner.query(`DROP TYPE "report_status";`)
    await queryRunner.query(`DROP TABLE "reports";`)
    await queryRunner.query(`DROP TABLE "protocol_actions";`)
    await queryRunner.query(`DROP TYPE "protocol_action";`)
    await queryRunner.query(`DROP TABLE "protocol_data";`)
    await queryRunner.query(`DROP TABLE "protocols";`)
    await queryRunner.query(`DROP TYPE "protocol_origin";`)
    await queryRunner.query(`DROP TYPE "protocol_status";`)
    await queryRunner.query(`DROP TABLE "sections";`)
    await queryRunner.query(`DROP TABLE "city_regions";`)
    await queryRunner.query(`DROP TABLE "towns";`)
    await queryRunner.query(`DROP TABLE "election_regions_municipalities";`)
    await queryRunner.query(`DROP TABLE "municipalities";`)
    await queryRunner.query(`DROP TABLE "countries";`)
    await queryRunner.query(`DROP TABLE "election_regions";`)
    await queryRunner.query(`DROP TABLE "person_confirmations";`)
    await queryRunner.query(`DROP TYPE "confirmation_type";`)
    await queryRunner.query(`DROP TABLE "people";`)
    await queryRunner.query(`DROP TABLE "organizations";`)
    await queryRunner.query(`DROP TABLE IF EXISTS "seeds";`)
  }
}
