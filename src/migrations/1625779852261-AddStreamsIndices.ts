import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStreamsIndices1625779852261 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create index "streams_stream_identifier_key" on "streams" ("stream_identifier");
        create index "stream_chunks_stream_id_key" on "stream_chunks" ("stream_id");
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        drop index "stream_chunks_stream_id_key";
        drop index "streams_stream_identifier_key";
      `);
  }
}
