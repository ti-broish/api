import { MigrationInterface, QueryRunner } from 'typeorm'

export class StreamChunksStartTimestampNotNull1625797593531
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE stream_chunks ALTER COLUMN start_timestamp DROP NOT NULL;
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE stream_chunks ALTER COLUMN start_timestamp SET NOT NULL;
      `)
  }
}
