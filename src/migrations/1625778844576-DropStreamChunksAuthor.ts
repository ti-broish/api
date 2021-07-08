import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropStreamChunksAuthor1625778844576 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table stream_chunks drop column author_id;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table stream_chunks add column "author_id" bpchar(26) NOT NULL;
      `);
  }
}
