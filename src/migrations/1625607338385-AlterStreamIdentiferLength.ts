import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterStreamIdentiferLength1625607338385
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "streams" alter column "stream_identifier" TYPE varchar(20)
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "streams" alter column "stream_identifier" TYPE bpchar(20)
      `);
  }
}
