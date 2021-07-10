import { MigrationInterface, QueryRunner } from 'typeorm';

export class IndexProtocolMetadataInvalidVotes1625958497758
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create index "protocols_invalid_votes_count_key" ON "protocols" USING GIN ((metadata->'invalidVotesCount'));
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        drop index "protocols_invalid_votes_count_key";
      `);
  }
}
