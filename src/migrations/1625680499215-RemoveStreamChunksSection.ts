import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveStreamChunksSection1625680499215
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      alter table "stream_chunks" drop constraint if exists "stream_chunks_section_id_fkey",
      drop column "section_id";
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      alter table "stream_chunks" add column "section_id" bpchar(9) NOT NULL,
      add constraint "stream_chunks_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id");
    `)
  }
}
