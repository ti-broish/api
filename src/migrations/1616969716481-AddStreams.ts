import {MigrationInterface, QueryRunner} from "typeorm";

export class AddStreams1616969716481 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        create table streams (
          id bpchar(26) not null,
          stream_identifier bpchar(20) not null,
          section_id char(9) default null,
          stream_url varchar not null,
          broadcast_url varchar not null,
          is_streaming boolean default false,
          is_assigned boolean default false,
          created_at timestamp default CURRENT_TIMESTAMP,
          updated_at timestamp default null,
          primary key("id"),
          unique("stream_url"),
          unique("broadcast_url"),
          constraint "streams_section_id_fkey" foreign key ("section_id") references "sections" ("id")
        );
      `);

      await queryRunner.query(`
        create index "streams_is_streaming_updated_at" on "streams" ("is_streaming", "updated_at");
        create index "streams_is_assigned_section_id" on "streams" ("is_assigned", "section_id");
      `);

      await queryRunner.query(`
        create table stream_chunks (
          id bpchar(26) not null,
          stream_id bpchar(26) not null,
          start_timestamp timestamp not null,
          end_timestamp timestamp default null,
          url varchar default null,
          section_id char(9) not null,
          author_id bpchar(26) not null,
          is_active boolean default true,
          primary key("id"),
          unique("url"),
          constraint "stream_chunks_author_id_fkey" foreign key ("author_id") references "people" ("id"),
          constraint "stream_chunks_stream_id_fkey" foreign key ("stream_id") references "streams" ("id"),
          constraint "stream_chunks_section_id_fkey" foreign key ("section_id") references "sections" ("id")
        );
      `);

      await queryRunner.query(`
        create index "stream_chunks_author_id" on "stream_chunks" ("author_id");
        create index "stream_chunks_stream_id" on "stream_chunks" ("stream_id");
        create index "stream_chunks_is_active_section_id_start_timestamp" on "stream_chunks" ("is_active", "section_id", "start_timestamp");
        create index "stream_chunks_is_active_section_id_end_timestamp" on "stream_chunks" ("is_active", "section_id", "end_timestamp");
      `);

      await queryRunner.query(`
        alter table "people"
        add column "stream_id" bpchar(26) default null,
        add column "section_id" char(9) default null,
        add constraint "people_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "streams" ("id"),
        add constraint "people_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections" ("id");
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        alter table "people"
        drop constraint "people_stream_id_fkey",
        drop constraint "people_section_id_fkey",
        drop column "stream_id",
        drop column "section_id";
      `);

      await queryRunner.query(`
        drop table "stream_chunks";
        drop table "streams";
      `);
    }

}
