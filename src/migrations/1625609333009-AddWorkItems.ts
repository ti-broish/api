import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkItems1625609333009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create table "work_items" (
          "id" bpchar(26) not null,
          "type" varchar not null,
          "origin" varchar not null,
          "protocol_id" bpchar(26) not null,
          "assignee_id" bpchar(26) default null,
          "is_assigned" boolean default false,
          "is_complete" boolean default false,
          "queue_position" bit(7) NOT NULL,
          "created_at" timestamp default CURRENT_TIMESTAMP,
          "completed_at" timestamp default NULL,
          primary key("id"),
          constraint "work_items_protocol_id_fkey" foreign key ("protocol_id") references "protocols" ("id"),
          constraint "work_items_assignee_id_fkey" foreign key ("assignee_id") references "people" ("id")
        );
      `);
    await queryRunner.query(`
        create index "work_items_type_key" on "work_items" ("type");
        create index "work_items_protocol_id_key" on "work_items" ("protocol_id");
        create index "work_items_type_is_assigned_is_complete_key" on "work_items" ("protocol_id");
        create index "work_items_queue_position_id_key" on "work_items" ("queue_position", "id");
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        drop index "work_items_type_key";
        drop index "work_items_protocol_id_key";
        drop index "work_items_type_is_assigned_is_complete_key";
        drop index "work_items_queue_position_id_key";
      `);

    await queryRunner.query(`
        drop table "work_items";
      `);
  }
}
