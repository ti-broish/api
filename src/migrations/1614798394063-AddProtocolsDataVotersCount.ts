import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProtocolsDataVotersCount1614798394063
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "protocol_data"
        ADD COLUMN "voters_count" int4 DEFAULT NULL
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "protocol_data"
        DROP COLUMN "voters_count"
      `);
  }
}
