import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEmailVerified1616233121395 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "people"
        add column "is_email_verified" boolean default false;
      `)
    await queryRunner.query(`
        drop table "person_confirmations";
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "person_confirmations" (
          "id" bpchar(26) NOT NULL,
          "person_id" bpchar(26) NOT NULL,
          "type" "public"."confirmation_type" NOT NULL,
          "code" varchar NOT NULL,
          "expires_at" timestamp NOT NULL,
          "confirmed_at" timestamp,
          CONSTRAINT "person_confirmations_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id"),
          PRIMARY KEY ("id")
        );
      `)
    await queryRunner.query(`
        alter table "people"
        drop column "is_email_verified";
      `)
  }
}
