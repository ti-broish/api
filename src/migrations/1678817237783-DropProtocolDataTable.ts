import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropProtocolDataTable1678817237783 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "protocol_data"')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "protocol_data" (
          "id" bpchar NOT NULL,
          "protocol_id" bpchar NOT NULL,
          "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "valid_votes_count" int4,
          "invalid_votes_count" int4,
          "machine_votes_count" int4,
          "voters_count" int4,
          "nonMachineCastBallotsCount" int4,
          "machineCastBallotsCount" int4,
          "castBallotsCount" int4,
          "partyNonMachineVotesCount" int4,
          "partyMachineVotesCount" int4,
          "partyValidVotesCount" int4,
          CONSTRAINT "protocol_data_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id"),
          PRIMARY KEY ("id")
      );`,
    )
  }
}
