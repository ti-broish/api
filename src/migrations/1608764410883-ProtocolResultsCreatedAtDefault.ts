import { MigrationInterface, QueryRunner } from 'typeorm'

export class ProtocolResultsCreatedAtDefault1608764410883
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "protocol_results" alter column "created_at" set default CURRENT_TIMESTAMP;
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "protocol_results" alter column "created_at" set default null;
      `)
  }
}
