import { MigrationInterface, QueryRunner } from 'typeorm'

export class BroadcastsAndPostsDrop1675208068164 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        drop table broadcasts_users;
        drop table broadcasts;
        drop table posts;
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create table "posts" (
          "id" bpchar(26) not null,
          "author_id" bpchar(26) not null,
          "title" varchar not null,
          "slug" varchar not null,
          "contents" text not null,
          "picture_id" bpchar(26) default null,
          "is_listed" boolean not null default false,
          "created_at" timestamp default current_timestamp not null,
          "publish_at" timestamp default null,
          primary key ("id"),
          constraint "posts_author_id_fkey" foreign key ("author_id") references "people" ("id"),
          constraint "posts_picture_id_fkey" foreign key ("picture_id") references "pictures" ("id")
        );
      `)

    await queryRunner.query(`
        create index "posts_publish_at_key" on "posts" ("publish_at");
      `)

    await queryRunner.query(`
        create table "broadcasts" (
          "id" bpchar(26) not null,
          "author_id" bpchar(26) not null,
          "title" varchar not null,
          "contents" text not null,
          "created_at" timestamp default current_timestamp not null,
          "publish_at" timestamp not null,
          "status" varchar not null,
          "topics" varchar default null,
          "data" json not null,
          primary key ("id"),
          constraint "broadcasts_author_id_fkey" foreign key ("author_id") references "people" ("id")
        );
      `)

    await queryRunner.query(`
        create index "broadcasts_publish_at_key" on "broadcasts" ("publish_at");
      `)

    await queryRunner.query(`
        create table "broadcasts_users" (
          "broadcast_id" bpchar(26) not null,
          "user_id" bpchar(26) not null,
          primary key ("broadcast_id", "user_id"),
          constraint "broadcasts_users_broadcast_id_fkey" foreign key ("broadcast_id") references "broadcasts" ("id"),
          constraint "broadcasts_users_user_id_fkey" foreign key ("user_id") references "people" ("id")
        );
      `)

    await queryRunner.query(`
        create index "broadcasts_users_user_id_key" on "broadcasts_users" ("user_id");
      `)
  }
}
