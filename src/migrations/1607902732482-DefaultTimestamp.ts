import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultTimestamp1607902732482 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "protocol_actions" alter column timestamp set default CURRENT_TIMESTAMP;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "protocol_actions" alter column timestamp set default null;
      `);
  }
}
