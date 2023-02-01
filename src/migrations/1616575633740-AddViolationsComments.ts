import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddViolationsComments1616575633740 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "violation_comments" (
        "id" bpchar(26) NOT NULL,
        "violation_id" bpchar(26) NOT NULL,
        "author_id" bpchar(26) NOT NULL,
        "text" text NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY ("id"),
        CONSTRAINT "violation_comments_violation_id_fkey" FOREIGN KEY ("violation_id") REFERENCES "violations" ("id"),
        CONSTRAINT "violation_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "people" ("id")
      );
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      drop table "violation_comments";
    `)
  }
}
