import {MigrationInterface, QueryRunner} from 'typeorm';

export class Organizations1607157753776 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      queryRunner.query(`
        insert into organizations (name) values ('Демократична България');
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      queryRunner.query(`TRUNCATE TABLE "organizations" RESTART IDENTITY CASCADE`);
    }

}
