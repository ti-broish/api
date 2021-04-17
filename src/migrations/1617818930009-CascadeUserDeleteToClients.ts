import { MigrationInterface, QueryRunner } from 'typeorm';

export class CascadeUserDeleteToClients1617818930009
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table clients
        drop constraint clients_owner_id_fkey;
        alter table clients
        add constraint clients_owner_id_fkey
          foreign key (owner_id)
          references people(id)
          on delete cascade;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table clients
        drop constraint clients_owner_id_fkey;
        alter table clients
        add constraint clients_owner_id_fkey
          foreign key (owner_id)
          references people(id);
      `);
  }
}
