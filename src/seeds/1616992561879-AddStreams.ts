import * as fs from 'fs';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { ulid } from 'ulid';
import { csvToSql } from 'src/utils/csvToSql';

export class AddStreams1616992561879 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const streamsInput = __dirname + '/parl-2021-04-04/streams.csv';
    if (!fs.existsSync(streamsInput)) {
      console.warn(`Missing streams seed input: ${streamsInput}`);
      return;
    }

    const sql = await csvToSql(streamsInput, 'streams', {
      emptyColumnCallback: () => {
        return ulid();
      },
    });

    sql.split(';').forEach(async (sql) => await queryRunner.query(sql));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`update "people" set "stream_id" = null;`);
    await queryRunner.query(`truncate table "stream_chunks" restart identity;`);
    await queryRunner.query(
      `truncate table "streams" restart identity cascade;`,
    );
  }
}
