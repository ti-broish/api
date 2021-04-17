import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPicturesRotation1617141731606 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table pictures add column rotation smallint default 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table pictures drop column rotation`);
  }
}
