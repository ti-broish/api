import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProtocolResultsNonMachineVotesCount1615972368733
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "protocol_results"
        add column "machine_votes_count" int default null,
        add column "non_machine_votes_count" int default null;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "protocol_results"
        drop column "machine_votes_count",
        drop column "non_machine_votes_count";
      `);
  }
}
