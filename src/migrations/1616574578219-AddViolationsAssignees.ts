import {MigrationInterface, QueryRunner} from "typeorm";

export class AddViolationsAssignees1616574578219 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "violations_assignees" (
        "violation_id" bpchar(26) NOT NULL,
        "assignee_id" bpchar(26) NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY ("violation_id", "assignee_id"),
        CONSTRAINT "violations_assignees_violation_id_fkey" FOREIGN KEY ("violation_id") REFERENCES "violations" ("id"),
        CONSTRAINT "violations_assignees_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "people" ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "violations_assignees";
    `);
  }
}
