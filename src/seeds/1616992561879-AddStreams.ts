import { csvToSql } from "src/utils/csvToSql";
import {MigrationInterface, QueryRunner} from "typeorm";
import { ulid } from "ulid";

export class AddStreams1616992561879 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(await csvToSql(
        __dirname + '/parl-2021-04-04/streams.csv',
        'streams',
        {
          emptyColumnCallback: (column: string) => {
            return ulid();
          }
        }
      ));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`update "people" set "stream_id" = null;`);
      await queryRunner.query(`truncate table "stream_chunks" restart identity;`);
      await queryRunner.query(`truncate table "streams" restart identity cascade;`);
    }

}
