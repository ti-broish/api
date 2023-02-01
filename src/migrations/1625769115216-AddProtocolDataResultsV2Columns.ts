import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProtocolDataResultsV2Columns1625769115216
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "protocol_results" add column "machine_votes" jsonb default null;
      `)
    await queryRunner.query(`
        update "protocol_results"
        set "machine_votes" = ('[' || "machine_votes_count" || ']')::jsonb
        where "machine_votes_count" > 0;
      `)
    await queryRunner.query(`
        alter table "protocols" add column "metadata" jsonb default null;
      `)
    await queryRunner.query(`
        update "protocols" set "metadata" = json_build_object(
          'validVotesCount', "protocol_data"."valid_votes_count",
          'invalidVotesCount', "protocol_data"."invalid_votes_count",
          'machineVotesCount', "protocol_data"."machine_votes_count",
          'votersCount', "protocol_data"."voters_count"
        )
        from "protocol_data" where protocol_data.protocol_id = protocols.id;
      `)
    await queryRunner.query(`
        alter table "protocol_results" drop column "invalid_votes_count";
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "protocol_results" add column "invalid_votes_count" integer default null;
      `)
    await queryRunner.query(`
        alter table "protocols" drop column "metadata";
      `)
    await queryRunner.query(`
        alter table "protocol_results" drop column "machine_votes";
      `)
  }
}
