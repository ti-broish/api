import { MigrationInterface, QueryRunner } from 'typeorm'

export class ProtocolsAssignees1612628420903 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "protocols_assignees" (
          "protocol_id" bpchar(26) NOT NULL,
          "assignee_id" bpchar(26) NOT NULL,
          "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
          PRIMARY KEY ("protocol_id", "assignee_id"),
          CONSTRAINT "protocols_assignees_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocols" ("id"),
          CONSTRAINT "protocols_assignees_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "people" ("id")
        );
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP TABLE "protocols_assignees";
      `)
  }
}
