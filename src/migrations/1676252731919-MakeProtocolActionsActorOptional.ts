import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeProtocolActionsActorOptional1676252731919
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "protocol_actions" ALTER COLUMN "actor_id" DROP NOT NULL;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "protocol_actions" ALTER COLUMN "actor_id" SET NOT NULL;
    `)
  }
}
