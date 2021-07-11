import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProtocolsRejectionReason1626021314813
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "protocols" add column "rejection_reason" varchar;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "protocols" drop column "rejection_reason";
      `);
  }
}
