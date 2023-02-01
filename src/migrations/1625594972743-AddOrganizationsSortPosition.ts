import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOrganizationsSortPosition1625594972743
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table organizations add column sort_position smallint default 0`,
    )

    await queryRunner.query(`
        create index "organizations_sort_position_key" on "organizations" ("sort_position");
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        drop index "organizations_sort_position_key";
      `)
    await queryRunner.query(
      `alter table organizations drop column sort_position`,
    )
  }
}
