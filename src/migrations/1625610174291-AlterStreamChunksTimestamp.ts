import { MigrationInterface, QueryRunner } from 'typeorm'

export class AlterStreamChunksTimestamp1625610174291
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "stream_chunks" alter column "start_timestamp" set default null;
        alter table "stream_chunks" alter column "end_timestamp" set default null;
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "stream_chunks" alter column "start_timestamp" set not null;
        alter table "stream_chunks" alter column "end_timestamp" set not null;
      `)
  }
}
