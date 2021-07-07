import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeWorkItemsProtocolAssigneeUnique1625635791732
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "work_items" add constraint "work_items_protocol_id_assignee_id_uniq" UNIQUE("protocol_id", "assignee_id");
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table "work_items" drop constraint "work_items_protocol_id_assignee_id_uniq";
      `);
  }
}
